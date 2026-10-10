"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "./AppProvider";
import { getSymptoms, knowledge, type SymptomGroup } from "@/lib/api";
import { searchSymptoms } from "@/lib/symptomSearch";
import { SEARCH } from "@/lib/searchStrings";

type Props = {
  selected: string[];
  setSelected: (next: string[]) => void;
  ageGroup: string;
  setAgeGroup: (v: string) => void;
  sex: string;
  setSex: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
};

export default function SymptomForm({
  selected,
  setSelected,
  ageGroup,
  setAgeGroup,
  sex,
  setSex,
  onSubmit,
  submitting,
  error,
}: Props) {
  const { lang, t } = useApp();
  const [groups, setGroups] = useState<SymptomGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [openIdx, setOpenIdx] = useState<number[]>([0]);
  const [query, setQuery] = useState("");
  const st = SEARCH[lang];
  const found = useMemo(() => searchSymptoms(knowledge, query, lang), [query, lang]);
  const showNoMatch = query.trim().length >= 2 && found.hits.length === 0 && found.notes.length === 0;

  useEffect(() => {
    let cancelled = false;
    getSymptoms(lang)
      .then((data) => {
        if (cancelled) return;
        setGroups(data);
        setLoadError(false);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const toggle = (slug: string) =>
    setSelected(selected.includes(slug) ? selected.filter((s) => s !== slug) : [...selected, slug]);

  const toggleOpen = (i: number) =>
    setOpenIdx((open) => (open.includes(i) ? open.filter((x) => x !== i) : [...open, i]));

  const selectClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2";

  return (
    <div>
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold">{t.aboutTitle}</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            {t.ageGroup}
            <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} className={selectClass}>
              <option value="child">{t.ageChild}</option>
              <option value="adult">{t.ageAdult}</option>
              <option value="older">{t.ageOlder}</option>
            </select>
          </label>
          <label className="text-sm">
            {t.sexLabel}
            <select value={sex} onChange={(e) => setSex(e.target.value)} className={selectClass}>
              <option value="female">{t.sexFemale}</option>
              <option value="male">{t.sexMale}</option>
              <option value="other">{t.sexOther}</option>
            </select>
          </label>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">{t.symptomsTitle}</h2>
        <p className="mt-1 text-sm text-slate-600">{t.symptomsHint}</p>
        <p className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
          <span>
            <span className="text-amber-600">●</span> {t.legendSevere}
          </span>
          <span>
            <span className="text-red-600">●</span> {t.legendRedFlag}
          </span>
        </p>

        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <label htmlFor="symptom-search" className="text-sm font-medium">
            {st.title}
          </label>
          <p className="mt-1 text-xs text-slate-600">{st.hint}</p>
          <input
            id="symptom-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={st.placeholder}
            autoComplete="off"
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
          />

          {found.notes.map((n, i) => (
            <p
              key={i}
              className={`mt-3 rounded-lg border p-3 text-sm ${
                n.tone === "urgent"
                  ? "border-red-300 bg-red-50 text-red-900"
                  : "border-amber-300 bg-amber-50 text-amber-900"
              }`}
            >
              {n.text}
            </p>
          ))}

          {found.hits.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {found.hits.map((h) => {
                const on = selected.includes(h.slug);
                const danger = h.severity === "red_flag";
                return (
                  <li key={h.slug}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(h.slug)}
                      className={`rounded-full border px-3 py-1.5 text-left text-sm transition ${
                        on
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : danger
                          ? "border-red-300 bg-white hover:border-red-500"
                          : "border-slate-300 bg-white hover:border-emerald-500"
                      }`}
                    >
                      {on ? "✓ " : "+ "}
                      {h.name}
                      {danger && (
                        <span className="ml-1" title={st.dangerSign}>
                          ⚠
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {showNoMatch && <p className="mt-3 text-sm text-slate-700">{st.noMatch}</p>}
        </div>

        {loading && <p className="mt-4 text-slate-500">{t.loading}</p>}
        {loadError && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{t.apiError}</p>
        )}

        <div className="mt-4 space-y-3">
          {groups.map((g, i) => {
            const open = openIdx.includes(i);
            const count = g.symptoms.filter((s) => selected.includes(s.slug)).length;
            return (
              <div key={i} className="rounded-xl border border-slate-200 bg-white">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => toggleOpen(i)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left font-medium"
                >
                  <span>
                    {g.category}
                    {count > 0 && (
                      <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                        {count}
                      </span>
                    )}
                  </span>
                  <span className="text-slate-400">{open ? "−" : "+"}</span>
                </button>
                {open && (
                  <ul className="grid gap-1 border-t border-slate-100 px-4 py-3 sm:grid-cols-2">
                    {g.symptoms.map((s) => (
                      <li key={s.slug}>
                        <label className="flex cursor-pointer items-start gap-2 rounded px-1 py-1.5 hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={selected.includes(s.slug)}
                            onChange={() => toggle(s.slug)}
                            className="mt-1 h-4 w-4 accent-emerald-600"
                          />
                          <span className="text-sm">
                            {s.name}
                            {s.severity === "severe" && <span className="ml-1 text-amber-600">●</span>}
                            {s.severity === "red_flag" && <span className="ml-1 text-red-600">●</span>}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
      )}

      <div className="sticky bottom-0 mt-6 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-1 py-3">
        <p className="text-sm text-slate-600">
          {selected.length === 0 ? t.pickOne : `${selected.length} ${t.selectedCount}`}
        </p>
        <button
          type="button"
          onClick={onSubmit}
          disabled={selected.length === 0 || submitting}
          className="rounded-lg bg-emerald-600 px-6 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? t.checking : t.checkButton}
        </button>
      </div>
    </div>
  );
}