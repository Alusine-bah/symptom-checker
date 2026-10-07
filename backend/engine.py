import json
import os
import sqlite3

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, "..", "data")
DB_PATH = os.path.join(DATA, "health.db")

URGENCY_ORDER = ["self_care", "routine", "urgent", "emergency"]
REGION_MULTIPLIER = {3: 1.0, 2: 0.8, 1: 0.5}
MISSING_REGION_MULTIPLIER = 0.2
MIN_SCORE = 0.1


def load_knowledge():
    """Read the whole database into memory once (it is small)."""
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row

    symptoms = {r["slug"]: dict(r) for r in con.execute("SELECT * FROM symptoms")}
    symptom_slug_by_id = {s["id"]: s["slug"] for s in symptoms.values()}
    regions = {r["code"]: dict(r) for r in con.execute("SELECT * FROM regions")}
    region_code_by_id = {r["id"]: r["code"] for r in regions.values()}

    diseases = {}
    for r in con.execute("SELECT * FROM diseases"):
        d = dict(r)
        d["weights"] = {}
        d["prevalence"] = {}
        diseases[d["id"]] = d
    for r in con.execute("SELECT * FROM disease_symptoms"):
        diseases[r["disease_id"]]["weights"][symptom_slug_by_id[r["symptom_id"]]] = r["weight"]
    for r in con.execute("SELECT * FROM disease_regions"):
        diseases[r["disease_id"]]["prevalence"][region_code_by_id[r["region_id"]]] = r["prevalence"]
    con.close()

    with open(os.path.join(DATA, "modifiers.json"), encoding="utf-8") as f:
        modifiers = json.load(f)

    return {
        "symptoms": symptoms,
        "regions": regions,
        "diseases": list(diseases.values()),
        "modifiers": modifiers,
    }


def match_label(score):
    if score >= 0.5:
        return "strong"
    if score >= 0.3:
        return "moderate"
    return "possible"


def triage(kb, region, age_group, sex, selected, lang="en"):
    lang = "fr" if lang == "fr" else "en"
    selected = list(dict.fromkeys(selected))  # remove duplicates, keep order

    if not selected:
        raise ValueError("Select at least one symptom.")
    unknown = [s for s in selected if s not in kb["symptoms"]]
    if unknown:
        raise ValueError(f"Unknown symptoms: {unknown}")
    if region not in kb["regions"]:
        raise ValueError(f"Unknown region: {region}")

    symptom_name = lambda slug: kb["symptoms"][slug][f"name_{lang}"]

    # Rule 1: red flags stop everything.
    red_flags = [s for s in selected if kb["symptoms"][s]["severity"] == "red_flag"]
    if red_flags:
        return {
            "status": "emergency",
            "urgency": "emergency",
            "red_flags": [symptom_name(s) for s in red_flags],
            "results": [],
        }

    results = []
    for d in kb["diseases"]:
        matched = [s for s in selected if s in d["weights"]]
        if not matched:
            continue

        explained = sum(d["weights"][s] for s in matched)
        precision = explained / len(selected)          # how much of what you ticked fits
        recall = explained / sum(d["weights"].values())  # how much of the disease picture you have
        base = 0.6 * precision + 0.4 * recall

        evidence = min(1.0, (len(matched) + 1) / 4)    # one symptom alone is weak evidence
        region_mult = REGION_MULTIPLIER.get(d["prevalence"].get(region), MISSING_REGION_MULTIPLIER)
        mods = kb["modifiers"].get(d["slug"], {})
        age_mult = mods.get("age", {}).get(age_group, 1.0)
        sex_mult = mods.get("sex", {}).get(sex, 1.0)

        score = min(0.99, base * evidence * region_mult * age_mult * sex_mult)

        missing = sorted(
            (s for s, w in d["weights"].items() if s not in selected and w >= 0.5),
            key=lambda s: -d["weights"][s],
        )[:3]

        results.append({
            "slug": d["slug"],
            "name": d[f"name_{lang}"],
            "description": d[f"description_{lang}"],
            "prevention": d[f"prevention_{lang}"],
            "urgency": d["urgency"],
            "source_url": d["source_url"],
            "score": score,
            "match_score": round(score * 100),
            "label": match_label(score),
            "matched": [symptom_name(s) for s in matched],
            "missing": [symptom_name(s) for s in missing],
        })

    results.sort(key=lambda r: -r["score"])
    top = [r for r in results if r["score"] >= MIN_SCORE][:3]

    # Overall urgency: most urgent among the reasonably likely matches...
    level = 0
    for r in top:
        if r["score"] >= 0.3:
            level = max(level, URGENCY_ORDER.index(r["urgency"]))
    # ...and any severe symptom raises it to at least "urgent".
    if any(kb["symptoms"][s]["severity"] == "severe" for s in selected):
        level = max(level, URGENCY_ORDER.index("urgent"))

    return {
        "status": "ok",
        "urgency": URGENCY_ORDER[level],
        "region": region,
        "results": top,
    }