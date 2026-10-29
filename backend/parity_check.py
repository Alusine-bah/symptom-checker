"""Check that the website (TypeScript) and backend (Python) engines give identical answers.

Usage (from the project folder):  python backend/parity_check.py [number_of_cases]
Needs Node 22.6 or newer. Runs random cases through both engines and compares every field
that matters, including the exact scores.
"""
import json
import os
import random
import subprocess
import sys
import tempfile

from engine import AGE_GROUPS, load_knowledge, triage

HERE = os.path.dirname(os.path.abspath(__file__))
KB_JSON = os.path.join(HERE, "..", "frontend", "lib", "knowledge.json")


def make_cases(kb, n, seed=2026):
    rng = random.Random(seed)
    symptoms = sorted(kb["symptoms"])
    regions = sorted(kb["regions"])
    cases = []
    for _ in range(n):
        cases.append({
            "region": rng.choice(regions),
            "age_group": rng.choice(AGE_GROUPS),
            "sex": rng.choice(["female", "male", "other"]),
            "symptoms": rng.sample(symptoms, rng.randint(1, 8)),
            "lang": rng.choice(["en", "fr"]),
            "pregnant": rng.random() < 0.2,
        })
    return cases


def python_answer(kb, c):
    out = triage(kb, c["region"], c["age_group"], c["sex"], c["symptoms"], lang=c["lang"], pregnant=c["pregnant"])
    return out


def compare(py, js):
    keys = ["status", "urgency", "red_flags", "few_symptoms", "pregnancy_note"]
    for k in keys:
        if py.get(k) != js.get(k):
            return f"{k}: python={py.get(k)!r} website={js.get(k)!r}"
    if len(py["results"]) != len(js["results"]):
        return "different number of results"
    for a, b in zip(py["results"], js["results"]):
        for k in ("slug", "name", "match_score", "label", "matched", "missing", "urgency"):
            if a[k] != b[k]:
                return f"result {a['slug']} {k}: python={a[k]!r} website={b[k]!r}"
    return None


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
    kb = load_knowledge()
    cases = make_cases(kb, n)
    with tempfile.TemporaryDirectory() as tmp:
        cases_path = os.path.join(tmp, "cases.json")
        out_path = os.path.join(tmp, "out.json")
        with open(cases_path, "w", encoding="utf-8") as f:
            json.dump(cases, f)
        subprocess.run(
            ["node", os.path.join(HERE, "parity_runner.mjs"), cases_path, KB_JSON, out_path],
            check=True,
            env={**os.environ, "NODE_NO_WARNINGS": "1"},
        )
        with open(out_path, encoding="utf-8") as f:
            website = json.load(f)

    bad = []
    for i, (c, js) in enumerate(zip(cases, website)):
        problem = compare(python_answer(kb, c), js)
        if problem:
            bad.append((i, problem, c))
    emergencies = sum(1 for w in website if w.get("status") == "emergency")
    print(f"Compared {len(cases)} random cases ({emergencies} emergencies).")
    if bad:
        print(f"{len(bad)} DIFFERENCES. First one:\n  {bad[0][1]}\n  {bad[0][2]}")
        sys.exit(1)
    print("Identical: the website and the backend give the same answers.")


if __name__ == "__main__":
    main()
