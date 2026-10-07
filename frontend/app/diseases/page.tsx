"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { getRegions, type Region } from "@/lib/api";
import { getDiseases, type DiseaseListItem } from "@/lib/diseaseApi";
import {
  ENC,
  PREV_BADGE,
  PREV_KEY,
  URGENCY_BADGE,
  URGENCY_KEY,
  firstLetter,
  normalize,
} from "@/lib/encyclopedia";

export default function DiseasesPage() {
  const { lang, region: myRegion } = useApp();
  const e = ENC[lang];
  const [regions, setRegions] = useState<Region[]>([]);
  const [filter, setFilter] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<DiseaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Start with the region the person picked on the home page.
  useEffect(() => {
    if (myRegion) setFilter(myRegion);
  }, [myRegion]);

  useEffect(() => {
    let cancelled = false;
    getRegions(lang)
      .then((list) => {
        if (!cancelled) setRegions(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    getDiseases(lang, filter || undefined)
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setError(false);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lang, filter]);

  const grouped = useMemo(() => {
    const q = normalize(query.trim());
    const list = items
      .filter((d) => !filter || d.prevalence_in_region != null)
      .filter((d) => !q || normalize(d.name).includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, lang));
    const map = new Map<string, DiseaseListItem[]>();
    for (const d of list) {
      const key = firstLetter(d.name);
      map.set(key, [...(map.get(key) ?? []), d]);
    }
    return { total: list.length, entries: Array.from(map.entries()) };
  }, [items, filter, query, lang]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold">{e.title}</h1>
      <p className="mt-2 text-slate-600">{e.intro}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <input
          type="search"
          value={query}
          onChange={(ev) => setQuery(ev.target.value)}
          placeholder={e.search}
          aria-label={e.search}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
        />
        <select
          value={filter}
          onChange={(ev) => setFilter(ev.target.value)}
          aria-label={e.regionFilter}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
        >
          <option value="">{e.allRegions}</option>
          {regions.map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="mt-6 text-slate-500">{e.loading}</p>}
      {error && (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{e.apiError}</p>
      )}

      {!loading && !error && (
        <>
          <p className="mt-4 text-sm text-slate-500">
            {grouped.total} {e.diseasesCount}
          </p>
          {grouped.total === 0 && <p className="mt-4 text-slate-600">{e.noResults}</p>}
          {grouped.entries.map(([letter, list]) => (
            <section key={letter} className="mt-6">
              <h2 className="mb-2 border-b border-slate-200 pb-1 text-lg font-bold text-emerald-700">
                {letter}
              </h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {list.map((d) => (
                  <li key={d.slug}>
                    <Link
                      href={`/diseases/${d.slug}`}
                      className="block rounded-xl border border-slate-200 bg-white p-3 hover:border-emerald-500"
                    >
                      <span className="font-medium">{d.name}</span>
                      <span className="mt-1 block text-xs text-slate-500">{d.category}</span>
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${URGENCY_BADGE[d.urgency]}`}>
                          {e[URGENCY_KEY[d.urgency]]}
                        </span>
                        {filter && d.prevalence_in_region != null && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${PREV_BADGE[d.prevalence_in_region]}`}
                          >
                            {e[PREV_KEY[d.prevalence_in_region]]}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </div>
  );
}