"""Export the whole knowledge base to one JSON file used by the website.

The website runs the scoring engine in the browser, so it needs no backend.
Run this after changing any file in data/ (and after build_db.py):

    python backend/build_db.py
    python backend/export_static.py
"""
import json
import os
import sqlite3

from engine import DB_PATH, load_knowledge

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "lib", "knowledge.json")


def build_data():
    kb = load_knowledge()

    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    categories = [dict(r) for r in con.execute("SELECT * FROM categories ORDER BY id")]
    con.close()

    regions = sorted(kb["regions"].values(), key=lambda r: r["id"])
    symptoms = sorted(kb["symptoms"].values(), key=lambda s: s["id"])

    data = {
        "regions": [{"code": r["code"], "en": r["name_en"], "fr": r["name_fr"]} for r in regions],
        "categories": [{"id": c["id"], "en": c["name_en"], "fr": c["name_fr"]} for c in categories],
        "symptoms": [
            {
                "slug": s["slug"],
                "category": s["category_id"],
                "en": s["name_en"],
                "fr": s["name_fr"],
                "severity": s["severity"],
            }
            for s in symptoms
        ],
        "diseases": [
            {
                "slug": d["slug"],
                "category": d["category_id"],
                "urgency": d["urgency"],
                "source_url": d["source_url"],
                "en": {
                    "name": d["name_en"],
                    "description": d["description_en"],
                    "cause": d["cause_en"],
                    "prevention": d["prevention_en"],
                },
                "fr": {
                    "name": d["name_fr"],
                    "description": d["description_fr"],
                    "cause": d["cause_fr"],
                    "prevention": d["prevention_fr"],
                },
                "weights": d["weights"],
                "prevalence": d["prevalence"],
            }
            for d in kb["diseases"]
        ],
        "modifiers": kb["modifiers"],
        "priors": kb["priors"],
    }
    return data


def main():
    data = build_data()

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    size = os.path.getsize(OUT)
    print(f"Wrote {os.path.normpath(OUT)} ({size // 1024} KB): "
          f"{len(data['diseases'])} diseases, {len(data['symptoms'])} symptoms, {len(data['regions'])} regions")


if __name__ == "__main__":
    main()
