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
    assert [t.type for t in s.boards[0].tiles] == ["due_now", "pet", "clock", "coming_up"]
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
    assert f"between 1 and {engine.BOARD_MAX}" in engine.validate_boards([])


def test_board_names_are_checked():
    assert engine.validate_boards([board(name="")]) == "Give each wall board a name."
    assert "up to 40 characters" in engine.validate_boards([board(name="x" * 41)])
    assert "Two wall boards are named" in engine.validate_boards([board(name="A"), board(name="a")])


def test_two_boards_cannot_share_an_id():
    a, b = board(id="1", name="A"), board(id="1", name="B")
    assert "same ID" in engine.validate_boards([a, b])


def test_the_most_boards_and_tiles():
    many = [board(name=f"B{i}") for i in range(engine.BOARD_MAX + 1)]
    assert f"between 1 and {engine.BOARD_MAX}" in engine.validate_boards(many)
    tiles = [{"type": "pet"} for _ in range(engine.BOARD_TILES_MAX + 1)]
    assert "at most" in engine.validate_boards([board(tiles=tiles)])


def test_columns_night_and_types_are_checked():
    assert "columns" in engine.validate_boards([board(columns=1)])
    assert "columns" in engine.validate_boards([board(columns=33)])
    assert "rows" in engine.validate_boards([board(rows=1)])
    assert "rows" in engine.validate_boards([board(rows=19)])
    assert "night" in engine.validate_boards([board(night="purple")])
    assert "unknown tile type" in engine.validate_boards([board(tiles=[{"type": "toaster"}])])


def test_tile_options_are_checked():
    ok = engine.validate_boards
    assert "format" in ok([board(tiles=[{"type": "clock", "options": {"format": "5h"}}])])
    assert "count" in ok([board(tiles=[{"type": "coming_up", "options": {"count": 99}}])])
    assert "up to 300 characters" in ok([board(tiles=[{"type": "note", "options": {"text": "x" * 301}}])])


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


def places(b):
    return [(t.x, t.y, t.w, t.h) for t in b.tiles]


def one(**kw):
    return {"type": "pet", **kw}


def test_the_default_board_has_places_that_fit():
    b = engine.default_board()
    assert (b.columns, b.rows) == (16, 9)
    assert places(b) == [(0, 0, 8, 5), (8, 0, 8, 5), (0, 5, 5, 4), (5, 5, 11, 4)]
    assert engine.validate_boards([b]) is None


def test_places_and_sizes_survive_saving_and_loading():
    b = board(columns=4, tiles=[one(x=1, y=2, w=3, h=2)])
    again = engine.Board.from_dict(engine.to_dict(b))
    assert places(again) == [(1, 2, 3, 2)]
    assert engine.validate_boards([again]) is None


def test_boards_from_before_places_are_laid_out_by_their_old_sizes():
    old = engine.Board.from_dict(
        {
            "name": "Old",
            "columns": 4,
            "tiles": [
                {"type": "due_now", "size": "big"},
                {"type": "pet", "size": "big"},
                {"type": "clock", "size": "wide"},
                {"type": "note", "size": "small"},
                {"type": "note", "size": "tall"},
            ],
        }
    )
    assert places(old) == [(0, 0, 2, 2), (2, 0, 2, 2), (0, 2, 2, 1), (2, 2, 1, 1), (3, 2, 1, 2)]
    assert engine.validate_boards([old]) is None


def test_a_tile_cannot_leave_the_board_or_sit_on_another():
    check = engine.validate_boards
    assert "outside" in check([board(columns=4, tiles=[one(x=3, y=0, w=2, h=1)])])
    assert "outside" in check([board(rows=9, tiles=[one(x=0, y=9, w=1, h=1)])])
    assert "fit" in check([board(rows=9, tiles=[one(x=0, y=0, w=1, h=10)])])
    assert "fit" in check([board(columns=3, tiles=[one(x=0, y=0, w=4, h=1)])])
    assert "same spot" in check([board(tiles=[one(x=0, y=0, w=2, h=2), {"type": "due_now", "x": 1, "y": 1, "w": 1, "h": 1}])])
    assert check([board(tiles=[one(x=0, y=0, w=2, h=2), {"type": "due_now", "x": 2, "y": 0, "w": 1, "h": 1}])]) is None


def test_the_old_away_tile_is_dropped_from_saved_boards():
    b = engine.Board.from_dict(
        {"name": "Old", "tiles": [{"type": "clock", "x": 0, "y": 0, "w": 2, "h": 1}, {"type": "away", "x": 0, "y": 1, "w": 4, "h": 1}]}
    )
    assert [t.type for t in b.tiles] == ["clock"]
    assert engine.validate_boards([b]) is None


def test_old_boards_get_their_rows_from_how_far_down_their_tiles_reach():
    old = engine.Board.from_dict({"name": "Old", "columns": 4, "tiles": [one(x=0, y=0, w=2, h=2), one(x=0, y=2, w=2, h=1)]})
    assert old.rows == 3
    assert engine.validate_boards([old]) is None


def test_rows_are_kept_when_given():
    b = engine.Board.from_dict({"name": "Tall", "columns": 9, "rows": 16, "tiles": [one(x=0, y=0, w=3, h=3)]})
    assert (b.columns, b.rows) == (9, 16)
    assert engine.validate_boards([engine.Board.from_dict(engine.to_dict(b))]) is None
