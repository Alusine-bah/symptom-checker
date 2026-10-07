export const API_BASE = "http://127.0.0.1:8000";

export type Lang = "en" | "fr";
export type Region = { code: string; name: string };

export async function getRegions(lang: Lang): Promise<Region[]> {
  const res = await fetch(`${API_BASE}/api/regions?lang=${lang}`);
  if (!res.ok) throw new Error("API error");
  return res.json();
}