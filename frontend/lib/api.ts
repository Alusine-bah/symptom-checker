export const API_BASE = "http://127.0.0.1:8000";

export type Lang = "en" | "fr";
export type Region = { code: string; name: string };
export type Severity = "minor" | "severe" | "red_flag";
export type SymptomItem = { slug: string; name: string; severity: Severity };
export type SymptomGroup = { category: string; symptoms: SymptomItem[] };
export type Urgency = "self_care" | "routine" | "urgent" | "emergency";
export type MatchLabel = "strong" | "moderate" | "possible";

export type DiseaseResult = {
  slug: string;
  name: string;
  description: string;
  prevention: string;
  urgency: Urgency;
  source_url: string;
  match_score: number;
  label: MatchLabel;
  matched: string[];
  missing: string[];
};

export type TriageResponse = {
  status: "ok" | "emergency";
  urgency: Urgency;
  few_symptoms?: boolean;
  red_flags?: string[];
  message?: string;
  disclaimer: string;
  results: DiseaseResult[];
};

export type TriageInput = {
  region: string;
  age_group: string;
  sex: string;
  symptoms: string[];
  lang: Lang;
};

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export const getRegions = (lang: Lang) => getJson<Region[]>(`/api/regions?lang=${lang}`);
export const getSymptoms = (lang: Lang) => getJson<SymptomGroup[]>(`/api/symptoms?lang=${lang}`);

export async function postTriage(input: TriageInput): Promise<TriageResponse> {
  const res = await fetch(`${API_BASE}/api/triage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("API error");
  return res.json();
}