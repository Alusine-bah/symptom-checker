"""Run the engine against clinical test vignettes and report accuracy.

Usage (from the project folder):  python backend/validate.py
"""
import json
import os

from engine import DATA, load_knowledge, triage


def main():
    with open(os.path.join(DATA, "vignettes.json"), encoding="utf-8") as f:
        vignettes = json.load(f)

    kb = load_knowledge()
    disease_cases = 0
    top1 = 0
    top3 = 0
    flag_cases = 0
    flag_hits = 0
    misses = []

    print(f"{'ID':<5}{'Result':<8}{'Top 3 returned':<62}Expected")
    print("-" * 100)
    for v in vignettes:
        out = triage(
            kb,
            region=v["region"],
            age_group=v["age_group"],
            sex=v["sex"],
            selected=v["symptoms"],
        )
        if v.get("expect_status") == "emergency":
            flag_cases += 1
            ok = out["status"] == "emergency"
            flag_hits += ok
            print(f"{v['id']:<5}{'PASS' if ok else 'FAIL':<8}{out['status']:<62}emergency")
            if not ok:
                misses.append(v["id"])
            continue

        disease_cases += 1
        names = [r["slug"] for r in out["results"]]
        hit1 = bool(names) and names[0] in v["expect"]
        hit3 = any(n in v["expect"] for n in names)
        top1 += hit1
        top3 += hit3
        label = "TOP-1" if hit1 else ("TOP-3" if hit3 else "MISS")
        shown = ", ".join(names) if names else "(no match)"
        print(f"{v['id']:<5}{label:<8}{shown:<62}{'/'.join(v['expect'])}")
        if not hit1:
            misses.append(v["id"])

    print("-" * 100)
    print(f"Disease cases: {disease_cases}")
    print(f"  Correct disease ranked first:     {top1}/{disease_cases}  ({round(100 * top1 / disease_cases)}%)")
    print(f"  Correct disease in top 3:         {top3}/{disease_cases}  ({round(100 * top3 / disease_cases)}%)")
    print(f"Red-flag cases caught as emergency: {flag_hits}/{flag_cases}")
    if misses:
        print("Not ranked first / failed:", ", ".join(misses))


if __name__ == "__main__":
    main()