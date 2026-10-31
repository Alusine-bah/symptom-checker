# Where the data comes from, and how to verify it

This page says plainly what in the app is sourced, what is estimated, and what has not been checked yet.

## 1. Disease text (descriptions, causes, prevention)

- **How it was made:** written from general medical knowledge, in English and French, and linked to a public-health page for the same disease (WHO, CDC or MedlinePlus).
- **What that means:** the wording is *not copied* from those pages. 62 diseases have been compared line by line with their pages (see `docs/VERIFICATION_LOG.md`); the rest have only passed the automatic screen in section 3. Each disease links to a main page, and to additional trusted sources (CDC, MedlinePlus, NHS or published papers) where a point is not on the main page. A point missing from one page is not treated as wrong: it is kept if another trusted source supports it, and the log says which.
- **Safety wording** (for example "go to emergency care if...") was added deliberately to entries where an emergency can hide.

## 2. Estimates that are not published figures

These are design choices, not clinical measurements, and cannot be called "medically proven":

| Item | What it is |
|---|---|
| Symptom weights (0 to 1) | How strongly a symptom points to a disease |
| Region levels (rare, common, very common) | How common a disease is in each of the 10 regions |
| Urgency level per disease | emergency, urgent, routine or self-care |
| Commonness values | Small adjustments so very rare or very common diseases rank sensibly |
| Age, sex and pregnancy adjustments | Small multipliers |
| Danger-sign list | Symptoms that stop the analysis and show an emergency alert |

They were checked against 75 test scenarios written by the same author, so the results show internal consistency, not real-world accuracy (see the README).

## 3. What is checked automatically

Run from the project folder:

```
python backend/verify_sources.py              # every link alive? does the page mention the disease?
python backend/verify_sources.py --content    # does the page contain the key terms of our cause/prevention wording?
python backend/verify_sources.py --open-blocked   # open pages that refuse scripts (such as CDC) to check by eye
python -m pytest backend/tests -q             # 100+ tests on the data and the scoring rules
```

The link check saves `docs/source-report.csv` with the result for each disease.
The content check is a rough screen, not proof: it flags wording that the cited page does not seem to support so a person can look.

## 4. What is still needed

- A line-by-line comparison of the remaining diseases with their cited pages.
- Review of the weights, region levels, urgency levels and danger signs by a doctor, nurse or other qualified clinician.
- Review of the French medical wording by a native French-speaking health professional.

Until then, the app is an **educational tool**. It does not diagnose and is not medical advice.

## 5. Last verification

Fill this in after each run of `verify_sources.py`:

| Date | Links checked | Broken | Blocked (checked by eye) | Notes |
|---|---|---|---|---|
| 2026-10-30 | 100 | 0 | 5 CDC pages (pertussis, group A strep, ringworm, scrub typhus, hand-foot-mouth): all open and show the right disease | 95 passed the script. The UTI wording is flagged by the content screen only because it now says the cited page gives no cause detail. |
