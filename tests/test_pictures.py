"""Pictures in the phone notification of a step."""

from __future__ import annotations

import importlib.util
import sys
from datetime import datetime, timezone
from pathlib import Path

_DIR = Path(__file__).parents[1] / "custom_components" / "boopli"


def _load(name: str, file: str):
    spec = importlib.util.spec_from_file_location(name, _DIR / file)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


engine = _load("boopli_engine_pictures", "engine.py")

T0 = datetime(2026, 11, 21, 10, 0, tzinfo=timezone.utc)


def chore(image: str = "") -> "engine.Chore":
    return engine.Chore(
        id="c",
        name="Take pills",
        steps=[engine.Step("a", "Take your pills", image=image)],
    )


# --- what is accepted ------------------------------------------------------------------------


def test_no_picture_is_fine():
    assert engine.validate_picture("") is None
    assert engine.validate_chore(chore()) is None


def test_a_camera_is_accepted():
    for ok in ("camera.front_door", "camera.kitchen_2"):
        assert engine.validate_picture(ok) is None


def test_files_in_the_media_folder_are_accepted():
    for ok in ("pills.jpg", "boopli/pills.png", "boopli/my pills (1).jpg", "a/b/c.GIF", "x.jpeg"):
        assert engine.validate_picture(ok) is None, ok


def test_everything_else_is_refused():
    for bad in (
        "https://example.com/pills.jpg",  # no web addresses: Boopli stays local
        "http://192.168.1.5/x.png",
        "/local/pills.jpg",  # no leading slash: always inside the media folder
        "../secret.jpg",
        "boopli/../../etc/x.jpg",
        "pills.txt",  # not a picture
        "pills.webp",  # phones do not show it in a notification
        "pills.heic",
        "pills",
        "camera.Front Door",
        "camera.",
        "light.kitchen",
        "x" * 130 + ".jpg",
        "a\\b.jpg",
    ):
        assert engine.validate_picture(bad), bad


def test_a_chore_with_a_bad_picture_cannot_be_saved():
    assert engine.validate_chore(chore("camera.front_door")) is None
    error = engine.validate_chore(chore("https://example.com/x.jpg"))
    assert error and "Take your pills" in error


# --- what the phone gets -----------------------------------------------------------------------


def test_a_camera_gives_a_snapshot_for_android_and_ios():
    assert engine.picture_data("camera.front_door") == {
        "image": "/api/camera_proxy/camera.front_door",
        "entity_id": "camera.front_door",
    }


def test_a_file_comes_from_the_media_folder_not_www():
    data = engine.picture_data("boopli/pills.jpg")
    assert data == {"image": "/media/local/boopli/pills.jpg"}
    assert "/local/" not in data["image"].replace("/media/local/", "")
    assert engine.picture_data("boopli/my pills.jpg", "kitchen") == {
        "image": "/media/kitchen/boopli/my%20pills.jpg"
    }


def test_a_file_named_like_a_camera_is_still_a_file():
    # "camera.snapshot.png" is not a camera id; "camera.png" ends like a picture, so it is one too.
    for name in ("camera.snapshot.png", "camera.png", "camera.my_pic.jpg"):
        assert engine.validate_picture(name) is None, name
        assert not engine.is_camera(name), name
        assert engine.picture_data(name) == {"image": f"/media/local/{name}"}
    assert engine.is_camera("camera.front_door")
    assert engine.is_camera("camera.demo_camera_png")  # an underscore, not a dot: a camera


def test_a_part_set_aside_keeps_its_pictures():
    c = chore("boopli/pills.jpg")
    run, _events = engine.start_run(c, T0)
    parked = engine.parked_chore(run, c, "Pills", run.steps, None, T0)
    assert [s.image for s in parked.steps] == ["boopli/pills.jpg"]


def test_no_picture_means_no_extra_data():
    assert engine.picture_data("") == {}


def test_the_nudge_is_unchanged_without_a_picture():
    plain = engine.phone_payload("normal", "r1", "s1", "Pills", "Take them", 15)
    assert "image" not in plain["data"] and "entity_id" not in plain["data"]
    assert plain == engine.phone_payload("normal", "r1", "s1", "Pills", "Take them", 15, "", "local")


def test_the_nudge_shows_the_picture():
    payload = engine.phone_payload("high", "r1", "s1", "Pills", "Take them", 15, "boopli/pills.jpg")
    assert payload["data"]["image"] == "/media/local/boopli/pills.jpg"
    assert payload["data"]["importance"] == "high"  # the rest is as before
    assert [a["title"] for a in payload["data"]["actions"]] == ["Done", "Snooze 15 min", "On it"]


def test_the_picture_stays_when_the_nudge_is_replaced():
    nudge = engine.phone_payload("normal", "r1", "s1", "Pills", "Take them", 15, "camera.pillbox")
    green = engine.on_it_payload("r1", "s1", "Pills", "Take them", "10:05", "camera.pillbox")
    check = engine.check_in_payload("r1", "s1", "Pills", "Take them", "camera.pillbox")
    for payload in (nudge, green, check):
        assert payload["data"]["image"] == "/api/camera_proxy/camera.pillbox"
        assert payload["data"]["tag"] == "boopli-r1-s1"


def test_without_a_picture_the_replacements_are_unchanged():
    green = engine.on_it_payload("r1", "s1", "Pills", "Take them", "10:05")
    check = engine.check_in_payload("r1", "s1", "Pills", "Take them")
    assert "image" not in green["data"] and "image" not in check["data"]


# --- it travels with the step ----------------------------------------------------------------------


def test_the_picture_survives_a_round_trip():
    saved = engine.Chore.from_dict(engine.to_dict(chore("boopli/pills.jpg")))
    assert saved.steps[0].image == "boopli/pills.jpg"


def test_a_chore_saved_before_pictures_has_none():
    old = engine.Chore.from_dict({"id": "c", "name": "Old", "steps": [{"id": "a", "title": "Step"}]})
    assert old.steps[0].image == ""


def test_the_running_chore_keeps_the_picture():
    run, _events = engine.start_run(chore("camera.pillbox"), T0)
    assert run.steps[0].image == "camera.pillbox"
    again = engine.StepRun.from_dict(engine.to_dict(run.steps[0]))
    assert again.image == "camera.pillbox"
