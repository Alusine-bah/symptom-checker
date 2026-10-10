import { knowledge } from "./api";
import type { Lang, Urgency } from "./engine";

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

const categoryName = (id: number, lang: Lang) => knowledge.categories.find((c) => c.id === id)![lang];

export async function getDiseases(lang: Lang, region?: string): Promise<DiseaseListItem[]> {
  const items = knowledge.diseases.map((d) => ({
    slug: d.slug,
    name: d[lang].name,
    category: categoryName(d.category, lang),
    urgency: d.urgency,
    prevalence_in_region: region ? d.prevalence[region] ?? null : null,
  }));
  items.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
  return items;
}

export async function getDisease(slug: string, lang: Lang): Promise<DiseaseDetail | null> {
  const d = knowledge.diseases.find((x) => x.slug === slug);
  if (!d) return null;
  const regionName = (code: string) => knowledge.regions.find((r) => r.code === code)![lang];
  const symptomName = (s: string) => knowledge.symptoms.find((x) => x.slug === s)![lang];
  const t = d[lang];
  return {
    slug: d.slug,
    name: t.name,
    category: categoryName(d.category, lang),
    description: t.description,
    cause: t.cause,
    prevention: t.prevention,
    urgency: d.urgency,
    source_url: d.source_url,
    regions: Object.entries(d.prevalence)
      .sort((a, b) => b[1] - a[1])
      .map(([code, prevalence]) => ({ code, name: regionName(code), prevalence })),
    symptoms: Object.entries(d.weights)
      .sort((a, b) => b[1] - a[1])
      .map(([slug, weight]) => ({ slug, name: symptomName(slug), weight })),
  };
}
