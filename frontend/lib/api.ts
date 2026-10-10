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
export type SymptomGroup = { category: string; symptoms: SymptomItem[] };

export async function getRegions(lang: Lang): Promise<Region[]> {
  return knowledge.regions.map((r) => ({ code: r.code, name: r[lang] }));
}

export async function getSymptoms(lang: Lang): Promise<SymptomGroup[]> {
  const groups = new Map<number, SymptomGroup>();
  for (const s of knowledge.symptoms) {
    let group = groups.get(s.category);
    if (!group) {
      const cat = knowledge.categories.find((c) => c.id === s.category)!;
      group = { category: cat[lang], symptoms: [] };
      groups.set(s.category, group);
    }
    group.symptoms.push({ slug: s.slug, name: s[lang], severity: s.severity });
  }
  return Array.from(groups.values());
}

export async function postTriage(input: TriageInput): Promise<TriageResponse> {
  return triage(knowledge, input);
}
