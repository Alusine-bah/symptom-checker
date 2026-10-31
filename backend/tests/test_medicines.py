"""Medicines guide data must be valid and the website file must be up to date."""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from export_static import MED_OUT, build_data, build_medicine_data  # noqa: E402
from medicines import load_medicines, validate  # noqa: E402

SLUGS = {d["slug"] for d in build_data()["diseases"]}


def entry(**over):
    e = {
        "slug": "test-drug", "status": "draft", "last_checked": "2026-11-01",
        "diseases": ["malaria"],
        "en": {"name": "Test", "what_it_is": ["a"], "used_for": ["b"]},
        "fr": {"name": "Test", "what_it_is": ["a"], "used_for": ["b"]},
        "sources": [{"title": "Src", "url": "https://example.org/x"}],
    }
    e.update(over)
    return e


def test_real_data_is_valid():
    assert validate(load_medicines(), SLUGS) == []


def test_website_file_is_up_to_date():
    with open(MED_OUT, encoding="utf-8") as f:
        on_disk = json.load(f)
    assert on_disk == build_medicine_data(), (
        "frontend/lib/medicines.json is out of date. Run:\n  python backend/export_static.py")


def test_every_entry_has_a_status_source_and_both_languages():
    for e in load_medicines():
        assert e["status"] in ("draft", "reviewed")
        assert e["sources"]
        assert e["en"]["name"] and e["fr"]["name"]


def test_valid_example_passes():
    assert validate([entry()], SLUGS) == []


def test_rejects_unknown_disease_bad_status_and_http_source():
    p = validate([entry(diseases=["nope"], status="final",
                        sources=[{"title": "x", "url": "http://insecure"}])], SLUGS)
    text = " ".join(p)
    assert "unknown disease" in text and "status must be" in text and "https" in text


def test_reviewed_needs_reviewer_and_date():
    assert any("reviewed_by" in p for p in validate([entry(status="reviewed")], SLUGS))
    ok = entry(status="reviewed", reviewed_by="A. Bah", reviewed_on="2026-11-02")
    assert validate([ok], SLUGS) == []


def test_english_and_french_must_match_in_length():
    e = entry()
    e["fr"]["used_for"] = ["b", "extra"]
    assert any("English and" in p for p in validate([e], SLUGS))


def test_source_without_link_is_allowed_but_needs_a_title():
    e = entry(sources=[{"title": "PDF supplied by the reviewer", "url": None}])
    assert validate([e], SLUGS) == []
    e = entry(sources=[{"title": "", "url": None}])
    assert any("without a title" in p for p in validate([e], SLUGS))
