import sqlite3
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from engine import DB_PATH, load_knowledge, triage

app = FastAPI(
    title="Symptom Checker API",
    description="Educational symptom triage and disease encyclopedia, focused on Africa and developing regions.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

kb = load_knowledge()


def load_categories():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    cats = {r["id"]: dict(r) for r in con.execute("SELECT * FROM categories")}
    con.close()
    return cats


categories = load_categories()

DISCLAIMER = {
    "en": "For information only. This is not a diagnosis and does not replace a doctor or health worker. If you feel very unwell, seek medical care.",
    "fr": "À titre informatif uniquement. Ceci n'est pas un diagnostic et ne remplace pas un médecin ou un agent de santé. Si vous vous sentez très mal, consultez un professionnel de santé.",
}

EMERGENCY_MESSAGE = {
    "en": "These symptoms can be serious. Go to the nearest hospital or call your local emergency number now. Do not wait.",
    "fr": "Ces symptômes peuvent être graves. Rendez-vous immédiatement à l'hôpital le plus proche ou appelez votre numéro d'urgence local. N'attendez pas.",
}


def pick_lang(lang: str) -> str:
    return "fr" if lang == "fr" else "en"


class TriageRequest(BaseModel):
    region: str
    age_group: str = Field(pattern="^(child|adult|older)$")
    sex: str = Field(pattern="^(female|male|other)$")
    symptoms: List[str] = Field(min_length=1, max_length=30)
    lang: str = "en"


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "diseases": len(kb["diseases"]),
        "symptoms": len(kb["symptoms"]),
        "regions": len(kb["regions"]),
    }


@app.get("/api/regions")
def list_regions(lang: str = "en"):
    l = pick_lang(lang)
    ordered = sorted(kb["regions"].values(), key=lambda r: r["id"])
    return [{"code": r["code"], "name": r[f"name_{l}"]} for r in ordered]


@app.get("/api/symptoms")
def list_symptoms(lang: str = "en"):
    l = pick_lang(lang)
    groups = {}
    for s in sorted(kb["symptoms"].values(), key=lambda s: s["id"]):
        group = groups.setdefault(
            s["category_id"],
            {"category": categories[s["category_id"]][f"name_{l}"], "symptoms": []},
        )
        group["symptoms"].append(
            {"slug": s["slug"], "name": s[f"name_{l}"], "severity": s["severity"]}
        )
    return list(groups.values())


@app.get("/api/diseases")
def list_diseases(lang: str = "en", region: Optional[str] = None, q: Optional[str] = None):
    l = pick_lang(lang)
    if region and region not in kb["regions"]:
        raise HTTPException(status_code=400, detail=f"Unknown region: {region}")
    items = []
    for d in kb["diseases"]:
        name = d[f"name_{l}"]
        if q and q.lower() not in name.lower():
            continue
        items.append({
            "slug": d["slug"],
            "name": name,
            "category": categories[d["category_id"]][f"name_{l}"],
            "urgency": d["urgency"],
            "prevalence_in_region": d["prevalence"].get(region) if region else None,
        })
    items.sort(key=lambda i: i["name"].lower())
    return items


@app.get("/api/diseases/{slug}")
def get_disease(slug: str, lang: str = "en"):
    l = pick_lang(lang)
    d = next((x for x in kb["diseases"] if x["slug"] == slug), None)
    if d is None:
        raise HTTPException(status_code=404, detail="Disease not found")
    return {
        "slug": d["slug"],
        "name": d[f"name_{l}"],
        "category": categories[d["category_id"]][f"name_{l}"],
        "description": d[f"description_{l}"],
        "cause": d[f"cause_{l}"],
        "prevention": d[f"prevention_{l}"],
        "urgency": d["urgency"],
        "source_url": d["source_url"],
        "regions": [
            {"code": code, "name": kb["regions"][code][f"name_{l}"], "prevalence": level}
            for code, level in sorted(d["prevalence"].items(), key=lambda kv: -kv[1])
        ],
        "symptoms": [
            {"slug": s, "name": kb["symptoms"][s][f"name_{l}"], "weight": w}
            for s, w in sorted(d["weights"].items(), key=lambda kv: -kv[1])
        ],
    }


@app.post("/api/triage")
def run_triage(req: TriageRequest):
    l = pick_lang(req.lang)
    try:
        result = triage(
            kb,
            region=req.region,
            age_group=req.age_group,
            sex=req.sex,
            selected=req.symptoms,
            lang=l,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if result["status"] == "emergency":
        result["message"] = EMERGENCY_MESSAGE[l]
    result["disclaimer"] = DISCLAIMER[l]
    return result