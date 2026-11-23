"""The wall board: boards, tiles, their options and the checks."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))

from custom_components.boopli import engine  # noqa: E402


def settings_with(boards):
    s = engine.Settings.from_dict({})
    s.boards = boards
    return s


def board(**kw):
    return engine.Board.from_dict({"name": "Wall", **kw})


def test_a_new_install_starts_with_one_board_and_its_tiles():
    s = engine.Settings.from_dict({})
    assert [b.name for b in s.boards] == ["Wall"]
    assert [t.type for t in s.boards[0].tiles] == ["due_now", "pet", "clock", "coming_up", "away"]
    assert engine.validate_settings(s) is None


def test_old_settings_without_boards_get_the_default_board():
    s = engine.Settings.from_dict({"pet_name": "Pip"})
    assert len(s.boards) == 1


def test_boards_survive_saving_and_loading():
    s = engine.Settings.from_dict({})
    s.boards.append(
        board(name="Desk", columns=3, night="black", tiles=[{"type": "note", "options": {"text": "Hi", "big": True}}])
    )
    again = engine.Settings.from_dict(engine.to_dict(s))
    desk = again.boards[1]
    assert (desk.name, desk.columns, desk.night) == ("Desk", 3, "black")
    assert desk.tiles[0].options == {"text": "Hi", "big": True}
    assert engine.validate_settings(again) is None


def test_every_tile_gets_its_default_options():
    t = engine.Tile.from_dict({"type": "coming_up"})
    assert t.options == {"count": 3}
    t = engine.Tile.from_dict({"type": "clock", "options": {"junk": 1}})
    assert t.options == {"format": "24h", "date": True}  # unknown options are dropped


def test_there_has_to_be_a_board():
    assert "1 to" in engine.validate_boards([])


def test_board_names_are_checked():
    assert engine.validate_boards([board(name="")]) == "Every board needs a name."
    assert "at most" in engine.validate_boards([board(name="x" * 41)])
    assert "two boards called" in engine.validate_boards([board(name="A"), board(name="a")])


def test_two_boards_cannot_share_an_id():
    a, b = board(id="1", name="A"), board(id="1", name="B")
    assert "same id" in engine.validate_boards([a, b])


def test_the_most_boards_and_tiles():
    many = [board(name=f"B{i}") for i in range(engine.BOARD_MAX + 1)]
    assert "1 to" in engine.validate_boards(many)
    tiles = [{"type": "pet"} for _ in range(engine.BOARD_TILES_MAX + 1)]
    assert "at most" in engine.validate_boards([board(tiles=tiles)])


def test_columns_night_and_sizes_are_checked():
    assert "columns" in engine.validate_boards([board(columns=1)])
    assert "columns" in engine.validate_boards([board(columns=9)])
    assert "night" in engine.validate_boards([board(night="purple")])
    assert "size" in engine.validate_boards([board(tiles=[{"type": "pet", "size": "huge"}])])
    assert "unknown tile type" in engine.validate_boards([board(tiles=[{"type": "toaster"}])])


def test_tile_options_are_checked():
    ok = engine.validate_boards
    assert "format" in ok([board(tiles=[{"type": "clock", "options": {"format": "5h"}}])])
    assert "count" in ok([board(tiles=[{"type": "coming_up", "options": {"count": 99}}])])
    assert "at most" in ok([board(tiles=[{"type": "note", "options": {"text": "x" * 301}}])])


def test_entity_tiles_need_the_right_kind_of_entity():
    def one(kind, entity):
        return engine.validate_boards([board(tiles=[{"type": kind, "options": {"entity_id": entity}}])])

    assert one("weather", "weather.home") is None
    assert one("weather", "sensor.temp") is not None
    assert one("weather", "") is not None  # pick one first
    assert one("calendar", "calendar.family") is None
    assert one("calendar", "weather.home") is not None
    assert one("camera", "camera.door") is None
    assert one("entity", "light.hall") is None  # any entity
    assert one("entity", "nodot") is not None
    assert one("entity", "") is not None


def test_a_board_is_part_of_the_settings_check():
    s = settings_with([board(night="purple")])
    assert "night" in engine.validate_settings(s)
