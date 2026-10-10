"""The website runs from frontend/lib/knowledge.json. Fail loudly if it is stale."""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from export_static import OUT, build_data  # noqa: E402


def test_static_export_is_up_to_date():
    with open(OUT, encoding="utf-8") as f:
        on_disk = json.load(f)
    assert on_disk == build_data(), (
        "frontend/lib/knowledge.json is out of date. Run:\n"
        "  python backend/build_db.py\n  python backend/export_static.py"
    )
