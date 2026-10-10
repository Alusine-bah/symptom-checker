// Scoring engine, ported 1:1 from backend/engine.py so the website can run
// without a server. Keep the two in sync (backend/tests + parity check).

export type Lang = "en" | "fr";
export type Severity = "minor" | "severe" | "red_flag";
export type Urgency = "self_care" | "routine" | "urgent" | "emergency";
export type MatchLabel = "strong" | "moderate" | "possible";

export type Texts = { name: string; description: string; cause: string; prevention: string };

export type KDisease = {
  slug: string;
  category: number;
  urgency: Urgency;
  source_url: string;
  en: Texts;
  fr: Texts;
  weights: Record<string, number>;
  prevalence: Record<string, number>;
};

export type KSymptom = { slug: string; category: number; en: string; fr: string; severity: Severity };

export type Knowledge = {
  regions: { code: string; en: string; fr: string }[];
  categories: { id: number; en: string; fr: string }[];
  symptoms: KSymptom[];
  diseases: KDisease[];
  modifiers: Record<string, { age?: Record<string, number>; sex?: Record<string, number> }>;
  priors: Record<string, number>;
};

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

const URGENCY_ORDER: Urgency[] = ["self_care", "routine", "urgent", "emergency"];
const REGION_MULTIPLIER: Record<number, number> = { 3: 1.0, 2: 0.65, 1: 0.35 };
const MISSING_REGION_MULTIPLIER = 0.2;
const MIN_SCORE = 0.1;
const MAX_SCORE = 0.9;

export const DISCLAIMER: Record<Lang, string> = {
  en: "For information only. This is not a diagnosis and does not replace a doctor or health worker. If you feel very unwell, seek medical care.",
  fr: "À titre informatif uniquement. Ceci n'est pas un diagnostic et ne remplace pas un médecin ou un agent de santé. Si vous vous sentez très mal, consultez un professionnel de santé.",
};

export const EMERGENCY_MESSAGE: Record<Lang, string> = {
  en: "These symptoms can be serious. Go to the nearest hospital or call your local emergency number now. Do not wait.",
  fr: "Ces symptômes peuvent être graves. Rendez-vous immédiatement à l'hôpital le plus proche ou appelez votre numéro d'urgence local. N'attendez pas.",
};

// Python 3.12+ adds floats with compensated (Neumaier) summation. Do the same,
// so the browser and the Python engine agree to the last digit.
function pySum(values: number[]): number {
  let sum = 0;
  let comp = 0;
  for (const x of values) {
    const t = sum + x;
    if (Math.abs(sum) >= Math.abs(x)) comp += sum - t + x;
    else comp += x - t + sum;
    sum = t;
  }
  return sum + comp;
}

// Python's round() rounds halves to the nearest even number; match it exactly.
function roundHalfEven(x: number): number {
  const f = Math.floor(x);
  const d = x - f;
  if (d > 0.5) return f + 1;
  if (d < 0.5) return f;
  return f % 2 === 0 ? f : f + 1;
}

function matchLabel(score: number): MatchLabel {
  if (score >= 0.5) return "strong";
  if (score >= 0.3) return "moderate";
  return "possible";
}

export function triage(kb: Knowledge, input: TriageInput): TriageResponse {
  const lang: Lang = input.lang === "fr" ? "fr" : "en";
  const selected = Array.from(new Set(input.symptoms));
  const symptoms = new Map(kb.symptoms.map((s) => [s.slug, s]));

  if (selected.length === 0) throw new Error("Select at least one symptom.");
  const unknown = selected.filter((s) => !symptoms.has(s));
  if (unknown.length > 0) throw new Error(`Unknown symptoms: ${unknown.join(", ")}`);
  if (!kb.regions.some((r) => r.code === input.region)) throw new Error(`Unknown region: ${input.region}`);

  const symptomName = (slug: string) => symptoms.get(slug)![lang];

  // Rule 1: red flags stop everything.
  const redFlags = selected.filter((s) => symptoms.get(s)!.severity === "red_flag");
  if (redFlags.length > 0) {
    return {
      status: "emergency",
      urgency: "emergency",
      red_flags: redFlags.map(symptomName),
      message: EMERGENCY_MESSAGE[lang],
      disclaimer: DISCLAIMER[lang],
      results: [],
    };
  }

  type Scored = DiseaseResult & { score: number };
  const results: Scored[] = [];

  for (const d of kb.diseases) {
    const matched = selected.filter((s) => s in d.weights);
    if (matched.length === 0) continue;

    const explained = pySum(matched.map((s) => d.weights[s]));
    const total = pySum(Object.values(d.weights));

    const precision = explained / selected.length;
    const recall = explained / total;
    const base = 0.6 * precision + 0.4 * recall;

    const evidence = Math.min(1.0, (matched.length + 1) / 4);
    const prev = d.prevalence[input.region];
    const regionMult = prev === undefined ? MISSING_REGION_MULTIPLIER : REGION_MULTIPLIER[prev];
    const mods = kb.modifiers[d.slug] ?? {};
    const ageMult = mods.age?.[input.age_group] ?? 1.0;
    const sexMult = mods.sex?.[input.sex] ?? 1.0;
    const prior = kb.priors[d.slug] ?? 1.0;

    const score = Math.min(MAX_SCORE, base * evidence * regionMult * ageMult * sexMult * prior);

    const missing = Object.entries(d.weights)
      .filter(([s, w]) => !selected.includes(s) && w >= 0.5)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([s]) => symptomName(s));

    const t = d[lang];
    results.push({
      slug: d.slug,
      name: t.name,
      description: t.description,
      prevention: t.prevention,
      urgency: d.urgency,
      source_url: d.source_url,
      score,
      match_score: roundHalfEven(score * 100),
      label: selected.length === 1 ? "possible" : matchLabel(score),
      matched: matched.map(symptomName),
      missing,
    });
  }

  results.sort((a, b) => b.score - a.score); // stable, like Python's sort
  const top = results.filter((r) => r.score >= MIN_SCORE).slice(0, 3);

  // Overall urgency: most urgent among the reasonably likely matches...
  let level = 0;
  for (const r of top) {
    if (r.score >= 0.3) level = Math.max(level, URGENCY_ORDER.indexOf(r.urgency));
  }
  // ...and any severe symptom raises it to at least "urgent".
  if (selected.some((s) => symptoms.get(s)!.severity === "severe")) {
    level = Math.max(level, URGENCY_ORDER.indexOf("urgent"));
  }

  return {
    status: "ok",
    urgency: URGENCY_ORDER[level],
    few_symptoms: selected.length < 2,
    disclaimer: DISCLAIMER[lang],
    results: top.map(({ score: _score, ...rest }) => rest),
  };
}
