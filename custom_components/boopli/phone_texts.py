"""The buttons and short sentences that phones and speakers get, in the other languages.

English is in engine.PHONE_TEXTS (engine.phone_text falls back to it). Home Assistant's language picks the set;
a language that is not here, or a text that is missing, shows English. Keep the {placeholders} as they are.
"""

from __future__ import annotations

LANGUAGES: dict[str, dict[str, str]] = {
    "de": {
        "done": "Fertig",
        "snooze": "Verschieben um {minutes} min",
        "on_it": "Bin dran",
        "not_on_it": "Stupse fortsetzen",
        "still_on_it": "Bin noch dran",
        "start_all_steps": "Mit allen Schritten starten",
        "answer_questions": "Fragen beantworten",
        "in_progress": "\u2705 In Arbeit: {step} (seit {since})",
        "still_on": "Bist du bei „{step}“ noch dran?",
        "quick_look_one": "Vorab {count} Frage dazu, was zu tun ist.",
        "quick_look_other": "Vorab {count} Fragen dazu, was zu tun ist.",
        "test_title": "Boopli-Test",
        "test_message": "Das ist ein Test für deine Boopli-Benachrichtigung.",
        "test_speech": "Geschirrspüler: ausräumen",
    },
    "nl": {
        "done": "Klaar",
        "snooze": "{minutes} min uitstellen",
        "on_it": "Ik ben bezig",
        "not_on_it": "Seintjes hervatten",
        "still_on_it": "Nog bezig",
        "start_all_steps": "Starten met alle stappen",
        "answer_questions": "Vragen beantwoorden",
        "in_progress": "\u2705 Bezig met {step} (sinds {since})",
        "still_on": "Nog bezig met {step}?",
        "quick_look_one": "Eerst even kijken wat er moet gebeuren. Nog {count} vraag.",
        "quick_look_other": "Eerst even kijken wat er moet gebeuren. Nog {count} vragen.",
        "test_title": "Boopli-test",
        "test_message": "Dit is een test van je Boopli-melding.",
        "test_speech": "Vaatwasser: uitruimen.",
    },
    "fr": {
        "done": "Terminé",
        "snooze": "Reporter de {minutes} min",
        "on_it": "Je m’y mets",
        "not_on_it": "Reprendre les rappels",
        "still_on_it": "J’y travaille encore",
        "start_all_steps": "Démarrer avec toutes les étapes",
        "answer_questions": "Répondre aux questions",
        "in_progress": "\u2705 En cours : {step} (depuis {since})",
        "still_on": "{step} : tu y travailles encore ?",
        "quick_look_one": "Avant de commencer : {count} question sur ce qu’il y a à faire.",
        "quick_look_other": "Avant de commencer : {count} questions sur ce qu’il y a à faire.",
        "test_title": "Test Boopli",
        "test_message": "Boopli t’envoie cette notification pour faire un test.",
        "test_speech": "Lave-vaisselle : vide-le.",
    },
    "es": {
        "done": "Listo",
        "snooze": "Posponer {minutes} min",
        "on_it": "Estoy en ello",
        "not_on_it": "Reanudar recordatorios",
        "still_on_it": "Sigo en ello",
        "start_all_steps": "Conservar todos los pasos",
        "answer_questions": "Responder las preguntas",
        "in_progress": "\u2705 En curso: {step} (desde {since})",
        "still_on": "¿Sigues en ello con «{step}»?",
        "quick_look_one": "Primero, un vistazo. Hay {count} pregunta sobre lo que hay que hacer.",
        "quick_look_other": "Primero, un vistazo. Hay {count} preguntas sobre lo que hay que hacer.",
        "test_title": "Prueba de Boopli",
        "test_message": "Esta es una prueba de tu notificación de Boopli.",
        "test_speech": "Lavavajillas: vaciarlo",
    },
}


def phone_texts_for(language: str | None) -> dict[str, str]:
    """The texts for a Home Assistant language such as "de" or "de-AT". English has none of its own: the
    notifier then uses engine.PHONE_TEXTS, and so does any text that is missing here."""
    code = (language or "en").replace("_", "-").split("-")[0].lower()
    return dict(LANGUAGES.get(code, {}))
