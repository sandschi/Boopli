"""Phone and speaker texts in the language of Home Assistant, and test notes the panel can translate."""

from __future__ import annotations

import importlib.util
import json
import re
import sys
from pathlib import Path

_DIR = Path(__file__).parents[1] / "custom_components" / "boopli"


def _load(name: str, file: str):
    spec = importlib.util.spec_from_file_location(name, _DIR / file)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


engine = _load("boopli_engine_phone_texts", "engine.py")
phone_texts = _load("boopli_phone_texts", "phone_texts.py")

LANGUAGES = ("de", "nl", "fr", "es")


def _places(text: str) -> list[str]:
    return sorted(re.findall(r"\{\w+\}", text))


def test_english_is_the_default():
    payload = engine.phone_payload("normal", "r1", "s1", "Kitchen", "Wipe", 15)
    assert [a["title"] for a in payload["data"]["actions"]] == ["Done", "Snooze 15 min", "On it"]
    assert engine.on_it_payload("r1", "s1", "Kitchen", "Wipe", "10:05")["message"] == "✅ In progress: Wipe (since 10:05)"
    assert engine.check_in_payload("r1", "s1", "Kitchen", "Wipe")["message"] == "Still on: Wipe?"
    assert "1 question " in engine.questions_payload("r", "x", 1)["message"]
    assert "2 questions " in engine.questions_payload("r", "x", 2)["message"]


def test_every_language_has_every_text_with_the_same_places():
    for code in LANGUAGES:
        texts = phone_texts.phone_texts_for(code)
        assert set(texts) == set(engine.PHONE_TEXTS), code
        for key, english in engine.PHONE_TEXTS.items():
            assert texts[key].strip(), (code, key)
            assert _places(texts[key]) == _places(english), (code, key)


def test_the_phone_gets_the_language_of_home_assistant():
    de = phone_texts.phone_texts_for("de")
    payload = engine.phone_payload("normal", "r1", "s1", "Küche", "Wischen", 15, texts=de)
    assert [a["title"] for a in payload["data"]["actions"]] != ["Done", "Snooze 15 min", "On it"]
    assert "15" in payload["data"]["actions"][1]["title"]
    questions = engine.questions_payload("r", "x", 2, de)
    assert "2" in questions["message"]
    assert questions["data"]["actions"][0]["title"] != "Start with all steps"
    green = engine.on_it_payload("r1", "s1", "Küche", "Wischen", "10:05", texts=de)
    assert "Wischen" in green["message"] and "10:05" in green["message"]


def test_a_regional_or_unknown_language_falls_back():
    assert phone_texts.phone_texts_for("de-AT") == phone_texts.phone_texts_for("de")
    assert phone_texts.phone_texts_for("pt-BR") == {}
    assert phone_texts.phone_texts_for(None) == {}
    # a missing text shows English
    assert engine.phone_text({"done": "Fertig"}, "on_it") == "On it"
    assert engine.phone_text({"done": "Fertig"}, "done") == "Fertig"


def test_the_break_down_service_has_its_texts_in_every_language():
    for code in ("en", *LANGUAGES):
        data = json.loads((_DIR / "translations" / f"{code}.json").read_text(encoding="utf8"))
        service = data["services"]["break_down"]
        assert service["name"] and service["description"], code
        assert set(service["fields"]) == {"task", "kind", "answers", "notes", "rooms"}, code
