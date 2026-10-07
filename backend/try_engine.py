from engine import load_knowledge, triage

kb = load_knowledge()


def show(title, **kwargs):
    print("=" * 64)
    print(title)
    out = triage(kb, **kwargs)
    if out["status"] == "emergency":
        print("  EMERGENCY - red flags:", ", ".join(out["red_flags"]))
        return
    print("  Overall urgency:", out["urgency"])
    if not out["results"]:
        print("  No clear match")
    for r in out["results"]:
        print(f"  {r['match_score']:>3}%  {r['label']:<9} {r['name']}  [{r['urgency']}]")
        print(f"        matched: {', '.join(r['matched'])}")


show("1. Fever, chills, headache - West Africa, adult",
     region="west_africa", age_group="adult", sex="female",
     selected=["fever", "chills", "headache"])

show("2. Same symptoms - Europe / N. America / Oceania",
     region="europe_namerica_oceania", age_group="adult", sex="female",
     selected=["fever", "chills", "headache"])

show("3. Cough only - West Africa, adult",
     region="west_africa", age_group="adult", sex="male",
     selected=["cough"])

show("4. Child with rash, fever, cough, red eyes, runny nose - East Africa",
     region="east_africa", age_group="child", sex="male",
     selected=["rash", "fever", "cough", "red_eyes", "runny_nose"])

show("5. Stiff neck + fever (red flag)",
     region="west_africa", age_group="adult", sex="male",
     selected=["stiff_neck", "fever"])

show("6. Scenario 1 in French",
     region="west_africa", age_group="adult", sex="female",
     selected=["fever", "chills", "headache"], lang="fr")