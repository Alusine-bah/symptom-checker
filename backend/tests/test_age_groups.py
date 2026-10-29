"""Age groups: newborn, infant, young child, child, adolescent, adult, older adult."""
import json
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from engine import AGE_GROUPS, DATA, NEWBORN_EMERGENCY_SYMPTOMS, load_knowledge, triage  # noqa: E402


@pytest.fixture(scope="module")
def kb():
    return load_knowledge()


def run(kb, symptoms, age, sex="female", region="west_africa", pregnant=False):
    return triage(kb, region=region, age_group=age, sex=sex, selected=symptoms, pregnant=pregnant)


def test_there_are_seven_age_groups():
    assert AGE_GROUPS == ["newborn", "infant", "young_child", "child", "adolescent", "adult", "older"]


def test_unknown_age_group_is_rejected(kb):
    with pytest.raises(ValueError):
        run(kb, ["fever"], age="teen")
    with pytest.raises(ValueError):
        run(kb, ["fever"], age="")


@pytest.mark.parametrize("age", AGE_GROUPS)
def test_every_age_group_works(kb, age):
    out = run(kb, ["cough", "runny_nose"], age=age)
    assert out["status"] == "ok"


def test_modifier_age_keys_are_valid(kb):
    for slug, mods in kb["modifiers"].items():
        assert set(mods.get("age", {})) <= set(AGE_GROUPS), slug


def test_the_four_childhood_groups_inherit_the_old_child_value(kb):
    """Nothing the old 'child' group did was lost: all four childhood groups carry it over."""
    measles = kb["modifiers"]["measles"]["age"]
    assert measles["newborn"] == measles["infant"] == measles["young_child"] == measles["child"] == 1.3
    # Adolescents sit halfway between child and adult.
    assert measles["adolescent"] == pytest.approx((1.3 + 0.8) / 2, abs=0.01)
    assert measles["adult"] == 0.8 and measles["older"] == 0.6


@pytest.mark.parametrize("symptom", sorted(NEWBORN_EMERGENCY_SYMPTOMS))
def test_each_newborn_danger_sign_is_an_emergency_for_a_newborn(kb, symptom):
    out = run(kb, [symptom, "cough"], age="newborn")
    assert out["status"] == "emergency"
    assert out["results"] == []


@pytest.mark.parametrize("age", [a for a in AGE_GROUPS if a != "newborn"])
def test_fever_alone_is_not_a_newborn_emergency_for_other_ages(kb, age):
    assert run(kb, ["fever"], age=age)["status"] == "ok"


def test_newborn_without_danger_signs_is_not_an_emergency(kb):
    assert run(kb, ["runny_nose", "sneezing"], age="newborn")["status"] == "ok"


def test_baby_danger_signs_make_an_infant_urgent_but_not_an_emergency(kb):
    for symptom in ("baby_poor_feeding", "baby_very_sleepy", "baby_cold"):
        out = run(kb, [symptom], age="infant")
        assert out["status"] == "ok"
        assert out["urgency"] == "urgent"


def test_newborn_emergency_lists_the_signs_found(kb):
    out = run(kb, ["fever", "cough", "baby_cold"], age="newborn")
    assert out["red_flags"] == ["Fever", "Baby feels cold to the touch"]


def test_baby_symptoms_exist_in_french_and_are_not_linked_to_diseases(kb):
    for slug in ("baby_poor_feeding", "baby_very_sleepy", "baby_cold"):
        assert kb["symptoms"][slug]["name_fr"]
        assert kb["symptoms"][slug]["severity"] == "severe"
        assert not any(slug in d["weights"] for d in kb["diseases"])


def test_vignettes_use_valid_age_groups():
    with open(os.path.join(DATA, "vignettes.json"), encoding="utf-8") as f:
        for v in json.load(f):
            assert v["age_group"] in AGE_GROUPS, v["id"]
