import medicinesJson from "./medicines.json";
import { knowledge } from "./api";
import type { Lang } from "./engine";

export type MedicineStatus = "draft" | "reviewed";

export type MedicineBlock = {
  name: string;
  what_it_is: string[];
  used_for: string[];
  how_used?: string[];
  who_careful?: string[];
  other_medicines?: string[];
  side_effects?: string[];
  pregnancy?: string[];
  urgent?: string[];
  open_points?: string[];
};

type RawMedicine = {
  slug: string;
  status: MedicineStatus;
  last_checked: string;
  reviewed_by?: string;
  reviewed_on?: string;
  diseases: string[];
  en: MedicineBlock;
  fr: MedicineBlock;
  sources: { title: string; url: string | null }[];
};

const all = medicinesJson as unknown as RawMedicine[];

export type MedicineListItem = {
  slug: string;
  name: string;
  summary: string;
  status: MedicineStatus;
};

export type MedicineDetail = MedicineBlock & {
  slug: string;
  status: MedicineStatus;
  last_checked: string;
  reviewed_by?: string;
  reviewed_on?: string;
  sources: { title: string; url: string | null }[];
  diseases: { slug: string; name: string }[];
};

export async function getMedicines(lang: Lang): Promise<MedicineListItem[]> {
  return all
    .map((m) => ({
      slug: m.slug,
      name: m[lang].name,
      summary: m[lang].what_it_is[0] ?? "",
      status: m.status,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, lang));
}

export async function getMedicine(slug: string, lang: Lang): Promise<MedicineDetail | null> {
  const m = all.find((x) => x.slug === slug);
  if (!m) return null;
  return {
    ...m[lang],
    slug: m.slug,
    status: m.status,
    last_checked: m.last_checked,
    reviewed_by: m.reviewed_by,
    reviewed_on: m.reviewed_on,
    sources: m.sources,
    diseases: m.diseases
      .map((s) => knowledge.diseases.find((d) => d.slug === s))
      .filter((d): d is NonNullable<typeof d> => !!d)
      .map((d) => ({ slug: d.slug, name: d[lang].name })),
  };
}

export async function getMedicinesForDisease(
  diseaseSlug: string,
  lang: Lang,
): Promise<{ slug: string; name: string; status: MedicineStatus }[]> {
  return all
    .filter((m) => m.diseases.includes(diseaseSlug))
    .map((m) => ({ slug: m.slug, name: m[lang].name, status: m.status }))
    .sort((a, b) => a.name.localeCompare(b.name, lang));
}
