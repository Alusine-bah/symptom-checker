// Data layer. Everything now runs inside the browser from knowledge.json,
// so the website works instantly, even offline, with no backend to wake up.
// The function names stay the same as the old API client, so screens did not change.

import knowledgeJson from "./knowledge.json";
import { triage, type Knowledge, type Lang, type TriageInput, type TriageResponse } from "./engine";

export type {
  Lang,
  Severity,
  Urgency,
  MatchLabel,
  DiseaseResult,
  TriageResponse,
  TriageInput,
} from "./engine";

export const knowledge = knowledgeJson as unknown as Knowledge;

export type Region = { code: string; name: string };
export type SymptomItem = { slug: string; name: string; severity: "minor" | "severe" | "red_flag" };
export type SymptomGroup = { category: string; symptoms: SymptomItem[]; pregnancyOnly?: boolean; babyOnly?: boolean };

// Pregnancy warning signs are only shown when the person says she is pregnant.
export const PREGNANCY_CATEGORY = 12;
export const PREGNANCY_SLUGS = knowledge.symptoms.filter((s) => s.category === PREGNANCY_CATEGORY).map((s) => s.slug);

// Baby danger signs are only shown for newborns and infants. Pregnancy can be asked from adolescence.
export const BABY_CATEGORY = 13;
export const BABY_SLUGS = knowledge.symptoms.filter((s) => s.category === BABY_CATEGORY).map((s) => s.slug);
export const isBabyAge = (age: string) => age === "newborn" || age === "infant";
export const canBePregnant = (sex: string, age: string) => sex === "female" && (age === "adolescent" || age === "adult");

export async function getRegions(lang: Lang): Promise<Region[]> {
  return knowledge.regions.map((r) => ({ code: r.code, name: r[lang] }));
}

export async function getSymptoms(lang: Lang): Promise<SymptomGroup[]> {
  const groups = new Map<number, SymptomGroup>();
  for (const s of knowledge.symptoms) {
    let group = groups.get(s.category);
    if (!group) {
      const cat = knowledge.categories.find((c) => c.id === s.category)!;
      group = {
        category: cat[lang],
        symptoms: [],
        pregnancyOnly: s.category === PREGNANCY_CATEGORY,
        babyOnly: s.category === BABY_CATEGORY,
      };
      groups.set(s.category, group);
    }
    group.symptoms.push({ slug: s.slug, name: s[lang], severity: s.severity });
  }
  return Array.from(groups.values());
}

export async function postTriage(input: TriageInput): Promise<TriageResponse> {
  return triage(knowledge, input);
}
