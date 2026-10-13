import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from engine import load_knowledge, triage  # noqa: E402

PREGNANCY_SIGNS = [
    "pregnancy_bleeding",
    "pregnancy_headache_vision",
    "pregnancy_swelling",
    "pregnancy_reduced_movement",
    "pregnancy_fluid_leak",
    "pregnancy_labour",
]


@pytest.fixture(scope="module")
def kb():
    return load_knowledge()


def run(kb, symptoms, pregnant, region="west_africa", sex="female", age="adult"):
    return triage(kb, region=region, age_group=age, sex=sex, selected=symptoms, pregnant=pregnant)


@pytest.mark.parametrize("sign", PREGNANCY_SIGNS)
def test_every_pregnancy_danger_sign_is_an_emergency(kb, sign):
    out = run(kb, [sign], pregnant=True)
    assert out["status"] == "emergency"
    assert out["results"] == []


def test_pregnancy_signs_are_red_flags_in_the_data(kb):
    for sign in PREGNANCY_SIGNS:
        assert kb["symptoms"][sign]["severity"] == "red_flag", sign


def test_pregnant_fever_is_at_least_urgent(kb):
    assert run(kb, ["fever", "chills"], pregnant=True)["urgency"] in ("urgent", "emergency")


def test_pregnant_mild_symptoms_are_at_least_routine(kb):
    not_pregnant = run(kb, ["runny_nose", "sneezing"], pregnant=False, region="europe_namerica_oceania")
    pregnant = run(kb, ["runny_nose", "sneezing"], pregnant=True, region="europe_namerica_oceania")
    assert not_pregnant["urgency"] == "self_care"
    assert pregnant["urgency"] == "routine"


def test_pregnancy_note_only_when_pregnant(kb):
    assert "pregnancy_note" in run(kb, ["fever", "chills"], pregnant=True)
    assert "pregnancy_note" not in run(kb, ["fever", "chills"], pregnant=False)


def test_pregnancy_note_is_translated(kb):
    out = triage(kb, region="west_africa", age_group="adult", sex="female",
                 selected=["fever", "chills"], lang="fr", pregnant=True)
    assert "enceinte" in out["pregnancy_note"]


def test_malaria_scores_higher_in_pregnancy(kb):
    base = run(kb, ["fever", "chills", "headache"], pregnant=False)["results"][0]
    preg = run(kb, ["fever", "chills", "headache"], pregnant=True)["results"][0]
    assert base["slug"] == preg["slug"] == "malaria"
    assert preg["match_score"] >= base["match_score"]


def test_period_pain_is_unlikely_in_pregnancy(kb):
    base = run(kb, ["period_pain", "lower_abdominal_pain_women"], pregnant=False)["results"][0]
    assert base["slug"] == "menstrual_cramps"
    preg = run(kb, ["period_pain", "lower_abdominal_pain_women"], pregnant=True)["results"]
    assert not preg or preg[0]["slug"] != "menstrual_cramps"
