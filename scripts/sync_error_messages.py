"""Keeps the "errors" part of frontend/src/i18n/en.json in step with the messages in the integration.

Every message the integration can send to the panel (BoopliError("..."), RoutineError("..."), Msg("...") and the
texts that the validators return) is an English template. The panel translates it by key. Run:

    python scripts/sync_error_messages.py          # rewrite en.json
    python scripts/sync_error_messages.py --check  # only say whether it is up to date (the tests use this)
"""

from __future__ import annotations

import ast
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / "custom_components" / "boopli"
EN_JSON = ROOT / "frontend" / "src" / "i18n" / "en.json"
CALLS = {"BoopliError", "RoutineError", "Msg"}


def _load_engine():
    spec = importlib.util.spec_from_file_location("boopli_engine_messages", PACKAGE / "engine.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def _call_name(call: ast.Call) -> str:
    func = call.func
    return func.id if isinstance(func, ast.Name) else func.attr if isinstance(func, ast.Attribute) else ""


def templates() -> list[str]:
    found: list[str] = []
    for path in sorted(PACKAGE.glob("*.py")):
        if path.name == "errors.py":
            continue
        tree = ast.parse(path.read_text(encoding="utf8"))
        parents = {child: node for node in ast.walk(tree) for child in ast.iter_child_nodes(node)}

        def function_of(node):
            while node in parents:
                node = parents[node]
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    return node
            return None

        for node in ast.walk(tree):
            if isinstance(node, ast.Call) and _call_name(node) in CALLS and node.args:
                first = node.args[0]
                if isinstance(first, ast.Constant) and isinstance(first.value, str) and first.value:
                    found.append(first.value)
            elif isinstance(node, ast.Return) and node.value is not None:
                # a text, or a conditional with texts in it (return None if ok else "Pick an NFC tag.")
                branches = [node.value]
                while any(isinstance(b, ast.IfExp) for b in branches):
                    branches = [x for b in branches for x in ((b.body, b.orelse) if isinstance(b, ast.IfExp) else (b,))]
                texts = [b.value for b in branches if isinstance(b, ast.Constant) and isinstance(b.value, str) and b.value]
                if not texts:
                    continue
                fn = function_of(node)
                returns = ast.unparse(fn.returns) if fn is not None and fn.returns is not None else ""
                # the validators return a text or None; _explain gives the plain reasons a routine call can fail
                if ("str" in returns and "None" in returns) or (fn is not None and fn.name == "_explain"):
                    found.extend(texts)
    return found


def expected() -> dict[str, str]:
    engine = _load_engine()
    out: dict[str, str] = {}
    for template in templates():
        out[engine.message_key(template)] = template
    return dict(sorted(out.items()))


def main() -> int:
    wanted = expected()
    data = json.loads(EN_JSON.read_text(encoding="utf8"))
    if data.get("errors") == wanted:
        print(f"errors in en.json are up to date ({len(wanted)} messages)")
        return 0
    if "--check" in sys.argv:
        old = data.get("errors", {})
        print("errors in en.json are out of date:")
        for key in sorted(set(wanted) | set(old)):
            if wanted.get(key) != old.get(key):
                print(f"  {key}: {wanted.get(key)!r} (file has {old.get(key)!r})")
        print("Run: python scripts/sync_error_messages.py")
        return 1
    data["errors"] = wanted
    EN_JSON.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
    print(f"errors in en.json written ({len(wanted)} messages)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
