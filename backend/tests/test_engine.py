import json
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from engine import DATA, load_knowledge, triage  # noqa: E402


@pytest.fixture(scope="module")
def kb():
    return load_knowledge()


def run(kb, symptoms, region="west_africa", age="adult", sex="female"):
    return triage(kb, region=region, age_group=age, sex=sex, selected=symptoms)


# ---------- Data integrity ----------

def test_counts(kb):
    # Minimums: the data only grows. Update these when you want to lock in a new size.
    assert len(kb["diseases"]) >= 80
    assert len(kb["symptoms"]) >= 74
    assert len(kb["regions"]) == 10


def test_every_disease_has_symptoms_regions_and_source(kb):
    for d in kb["diseases"]:
        assert d["weights"], f"{d['slug']} has no symptoms"
        assert d["prevalence"], f"{d['slug']} has no regions"
        assert d["source_url"].startswith("https://"), d["slug"]
        assert d["name_fr"] and d["description_fr"], f"{d['slug']} lacks French text"


def test_weights_are_between_0_and_1(kb):
    for d in kb["diseases"]:
        for slug, w in d["weights"].items():
            assert 0 <= w <= 1, (d["slug"], slug, w)


def test_red_flags_are_never_scored(kb):
    """Red-flag symptoms must stop the engine, so no disease should depend on them."""
    red = {s for s, v in kb["symptoms"].items() if v["severity"] == "red_flag"}
    for d in kb["diseases"]:
        assert not (red & set(d["weights"])), d["slug"]


def test_every_symptom_has_french_text(kb):
    for s in kb["symptoms"].values():
        assert s["name_fr"], s["slug"]


def test_modifier_and_prior_slugs_exist(kb):
    slugs = {d["slug"] for d in kb["diseases"]}
    assert set(kb["modifiers"]) <= slugs
    assert set(kb["priors"]) <= slugs


# ---------- Engine behaviour ----------

def test_red_flag_stops_everything(kb):
    out = run(kb, ["stiff_neck", "fever"])
    assert out["status"] == "emergency"
    assert out["results"] == []
    assert out["urgency"] == "emergency"


def test_region_changes_ranking(kb):
    symptoms = ["fever", "chills", "headache"]
    west = run(kb, symptoms, region="west_africa")
    europe = run(kb, symptoms, region="europe_namerica_oceania")
    assert west["results"][0]["slug"] == "malaria"
    assert europe["results"][0]["slug"] == "influenza"


def test_single_symptom_is_never_a_strong_match(kb):
    out = run(kb, ["cough"])
    assert out["few_symptoms"] is True
    assert all(r["label"] == "possible" for r in out["results"])


def test_scores_are_capped(kb):
    out = run(kb, ["fever", "rash", "cough", "runny_nose", "red_eyes"], region="east_africa", age="child")
    assert all(r["match_score"] <= 90 for r in out["results"])


def test_severe_symptom_raises_urgency(kb):
    out = run(kb, ["severe_abdominal_pain"])
    assert out["urgency"] in ("urgent", "emergency")


def test_mild_symptoms_stay_self_care(kb):
    out = run(kb, ["runny_nose", "sneezing"], region="europe_namerica_oceania")
    assert out["urgency"] == "self_care"


def test_french_output(kb):
    out = triage(kb, region="west_africa", age_group="adult", sex="female",
                 selected=["fever", "chills", "headache"], lang="fr")
    assert out["results"][0]["name"] == "Paludisme"


def test_duplicate_symptoms_are_ignored(kb):
    a = run(kb, ["fever", "chills"])
    b = run(kb, ["fever", "fever", "chills"])
    assert [r["slug"] for r in a["results"]] == [r["slug"] for r in b["results"]]


def test_bad_input_is_rejected(kb):
    with pytest.raises(ValueError):
        run(kb, [])
    with pytest.raises(ValueError):
        run(kb, ["not_a_symptom"])
    with pytest.raises(ValueError):
        run(kb, ["fever"], region="atlantis")


# ---------- Clinical vignettes ----------

def vignettes():
    with open(os.path.join(DATA, "vignettes.json"), encoding="utf-8") as f:
        return json.load(f)


@pytest.mark.parametrize("v", vignettes(), ids=lambda v: v["id"])
def test_vignette(kb, v):
    out = triage(kb, region=v["region"], age_group=v["age_group"], sex=v["sex"], selected=v["symptoms"])
    if v.get("expect_status") == "emergency":
        assert out["status"] == "emergency"
    else:
        slugs = [r["slug"] for r in out["results"]]
        assert any(s in v["expect"] for s in slugs[:3]), (v["note"], slugs)