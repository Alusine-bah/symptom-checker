import { API_BASE, type Lang, type Urgency } from "./api";

export type DiseaseListItem = {
  slug: string;
  name: string;
  category: string;
  urgency: Urgency;
  prevalence_in_region: number | null;
};

export type DiseaseDetail = {
  slug: string;
  name: string;
  category: string;
  description: string;
  cause: string;
  prevention: string;
  urgency: Urgency;
  source_url: string;
  regions: { code: string; name: string; prevalence: number }[];
  symptoms: { slug: string; name: string; weight: number }[];
};

export async function getDiseases(lang: Lang, region?: string): Promise<DiseaseListItem[]> {
  const qs = new URLSearchParams({ lang });
  if (region) qs.set("region", region);
  const res = await fetch(`${API_BASE}/api/diseases?${qs.toString()}`);
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export async function getDisease(slug: string, lang: Lang): Promise<DiseaseDetail | null> {
  const res = await fetch(`${API_BASE}/api/diseases/${encodeURIComponent(slug)}?lang=${lang}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("API error");
  return res.json();
}