"""Which pet it is."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

_DIR = Path(__file__).parents[1] / "custom_components" / "boopli"


def _load(name: str, file: str):
    spec = importlib.util.spec_from_file_location(name, _DIR / file)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


engine = _load("boopli_engine_pets", "engine.py")


def test_there_are_five_pets_and_a_default():
    assert engine.PET_KINDS == ("bear", "cat", "dog", "fox", "slime")
    assert engine.PET_KIND_DEFAULT in engine.PET_KINDS
    assert engine.Settings.from_dict({}).pet_kind == engine.PET_KIND_DEFAULT


def test_every_pet_is_accepted():
    for kind in engine.PET_KINDS:
        settings = engine.Settings.from_dict({"pet_kind": kind})
        assert settings.pet_kind == kind
        assert engine.validate_settings(settings) is None


def test_an_unknown_pet_is_refused():
    for bad in ("dragon", "Slime", "../cat", "bear;cat"):
        settings = engine.Settings.from_dict({"pet_kind": bad})
        assert engine.validate_settings(settings), bad


def test_settings_saved_before_pets_get_the_default():
    old = engine.Settings.from_dict({"pet_name": "Rex"})
    assert old.pet_kind == engine.PET_KIND_DEFAULT
    assert old.pet_name == "Rex"


def test_the_choice_survives_a_round_trip():
    s = engine.Settings.from_dict({"pet_kind": "fox", "pet_name": "Foxy"})
    again = engine.Settings.from_dict(engine.to_dict(s))
    assert again.pet_kind == "fox" and again.pet_name == "Foxy"
