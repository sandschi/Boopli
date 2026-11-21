"""Tests for the setup wizard's saved state."""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

_PATH = Path(__file__).parents[1] / "custom_components" / "boopli" / "engine.py"
_SPEC = importlib.util.spec_from_file_location("boopli_engine_setup", _PATH)
engine = importlib.util.module_from_spec(_SPEC)
sys.modules["boopli_engine_setup"] = engine
_SPEC.loader.exec_module(engine)


def test_a_brand_new_install_has_not_done_the_setup():
    assert engine.initial_setup({}) == engine.Setup(status="new")


def test_an_existing_install_counts_as_done_so_the_wizard_never_ambushes_it():
    for key in ("chores", "settings", "runs", "history"):
        assert engine.initial_setup({key: [{"x": 1}] if key != "settings" else {"a": 1}}).status == "done"


def test_empty_stored_lists_do_not_count_as_an_existing_install():
    assert engine.initial_setup({"chores": [], "runs": [], "history": []}).status == "new"


def test_setup_state_roundtrips():
    s = engine.Setup(status="in_progress", step="quiet")
    assert engine.Setup.from_dict(json.loads(json.dumps(engine.to_dict(s)))) == s


def test_bad_or_missing_stored_setup_falls_back_to_new():
    assert engine.Setup.from_dict(None) == engine.Setup()
    assert engine.Setup.from_dict({"status": "dancing"}).status == "new"
    assert len(engine.Setup.from_dict({"step": "x" * 100}).step) == engine.SETUP_STEP_MAX


def test_validation():
    assert engine.validate_setup(engine.Setup(status="skipped", step="phone")) is None
    assert engine.validate_setup(engine.Setup(status="dancing"))
    assert engine.validate_setup(engine.Setup(status="done", step="x" * 41))
