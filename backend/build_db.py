import glob
import json
import os
import sqlite3

DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
DB_PATH = os.path.join(DATA, "health.db")


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def main():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    con = sqlite3.connect(DB_PATH)
    con.execute("PRAGMA foreign_keys = ON")
    with open(os.path.join(DATA, "schema.sql"), encoding="utf-8") as f:
        con.executescript(f.read())

    base = load(os.path.join(DATA, "base.json"))
    for r in base["regions"]:
        con.execute("INSERT INTO regions VALUES (?,?,?,?)",
                    (r["id"], r["code"], r["en"], r["fr"]))
    for c in base["categories"]:
        con.execute("INSERT INTO categories VALUES (?,?,?)",
                    (c["id"], c["en"], c["fr"]))

    symptom_ids = {}
    for i, s in enumerate(base["symptoms"], start=1):
        con.execute("INSERT INTO symptoms VALUES (?,?,?,?,?,?)",
                    (i, s["slug"], s["cat"], s["en"], s["fr"], s["sev"]))
        symptom_ids[s["slug"]] = i
    region_ids = {r["code"]: r["id"] for r in base["regions"]}

    disease_count = 0
    for path in sorted(glob.glob(os.path.join(DATA, "diseases_*.json"))):
        for d in load(path):
            disease_count += 1
            en, fr = d["en"], d["fr"]
            con.execute(
                """INSERT INTO diseases
                (id, slug, category_id, name_en, name_fr, description_en, description_fr,
                 cause_en, cause_fr, prevention_en, prevention_fr, urgency, icd11_code, source_url)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (disease_count, d["slug"], d["cat"], en["name"], fr["name"],
                 en["description"], fr["description"], en["cause"], fr["cause"],
                 en["prevention"], fr["prevention"], d["urgency"],
                 d.get("icd11"), d["source_url"]))
            for code, level in d["regions"].items():
                con.execute("INSERT INTO disease_regions VALUES (?,?,?)",
                            (disease_count, region_ids[code], level))
            for slug, weight in d["symptoms"].items():
                if slug not in symptom_ids:
                    raise SystemExit(f"Unknown symptom '{slug}' in disease '{d['slug']}'")
                con.execute("INSERT INTO disease_symptoms VALUES (?,?,?)",
                            (disease_count, symptom_ids[slug], weight))

    con.commit()
    print(f"Built database: {disease_count} diseases, {len(symptom_ids)} symptoms, "
          f"{len(region_ids)} regions")
    con.close()


if __name__ == "__main__":
    main()