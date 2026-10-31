"""Medicines guide data: load, validate and export.

Entries live in data/medicines_*.json. Each entry has a status:
  "draft"     published for readers and reviewers, not yet clinically reviewed
  "reviewed"  checked by the clinical reviewer (reviewed_by and reviewed_on are then required)

Run backend/export_static.py after any change to write frontend/lib/medicines.json.
"""
import glob
import json
import os
import re

DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")

STATUSES = ("draft", "reviewed")
LANGS = ("en", "fr")
TEXT_KEY = "name"
LIST_KEYS = ("what_it_is", "used_for", "how_used", "who_careful", "other_medicines",
             "side_effects", "pregnancy", "urgent", "open_points")
REQUIRED_LISTS = ("what_it_is", "used_for")
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
SLUG = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


def load_medicines():
    entries = []
    for path in sorted(glob.glob(os.path.join(DATA, "medicines_*.json"))):
        with open(path, encoding="utf-8") as f:
            entries.extend(json.load(f))
    return entries


def validate(entries, disease_slugs):
    """Return a list of problems (empty when everything is fine)."""
    problems = []
    seen = set()
    for e in entries:
        slug = e.get("slug", "?")
        if not SLUG.match(str(slug)):
            problems.append(f"{slug}: bad slug")
        if slug in seen:
            problems.append(f"{slug}: duplicate slug")
        seen.add(slug)
        if e.get("status") not in STATUSES:
            problems.append(f"{slug}: status must be one of {STATUSES}")
        if not DATE.match(str(e.get("last_checked", ""))):
            problems.append(f"{slug}: last_checked must be YYYY-MM-DD")
        if e.get("status") == "reviewed":
            if not e.get("reviewed_by") or not DATE.match(str(e.get("reviewed_on", ""))):
                problems.append(f"{slug}: reviewed entries need reviewed_by and reviewed_on")
        for d in e.get("diseases", []):
            if d not in disease_slugs:
                problems.append(f"{slug}: unknown disease '{d}'")
        for lang in LANGS:
            block = e.get(lang)
            if not isinstance(block, dict):
                problems.append(f"{slug}: missing '{lang}' block")
                continue
            if not str(block.get(TEXT_KEY, "")).strip():
                problems.append(f"{slug}/{lang}: missing name")
            for k in LIST_KEYS:
                v = block.get(k, [])
                if not isinstance(v, list) or any(not isinstance(x, str) or not x.strip() for x in v):
                    problems.append(f"{slug}/{lang}: '{k}' must be a list of non-empty strings")
            for k in REQUIRED_LISTS:
                if not block.get(k):
                    problems.append(f"{slug}/{lang}: '{k}' is required")
            extra = set(block) - set(LIST_KEYS) - {TEXT_KEY}
            if extra:
                problems.append(f"{slug}/{lang}: unknown keys {sorted(extra)}")
        # English and French must have the same sections and the same number of items
        en, fr = e.get("en", {}), e.get("fr", {})
        for k in LIST_KEYS:
            if len(en.get(k, [])) != len(fr.get(k, [])):
                problems.append(f"{slug}: '{k}' has {len(en.get(k, []))} English and "
                                f"{len(fr.get(k, []))} French items")
        sources = e.get("sources", [])
        if not sources:
            problems.append(f"{slug}: at least one source is required")
        for s in sources:
            if not str(s.get("title", "")).strip():
                problems.append(f"{slug}: source without a title")
            url = s.get("url")
            if url is not None and not str(url).startswith("https://"):
                problems.append(f"{slug}: source url must be https or null: {url}")
    return problems


def build_medicines(disease_slugs):
    entries = load_medicines()
    problems = validate(entries, disease_slugs)
    if problems:
        raise SystemExit("Medicines data problems:\n  " + "\n  ".join(problems))
    return sorted(entries, key=lambda e: e["slug"])
