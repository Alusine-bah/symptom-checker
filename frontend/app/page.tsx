"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { getRegions, type Region } from "@/lib/api";

function RegionGrid({
  title,
  items,
  selected,
  onSelect,
  accent,
}: {
  title: string;
  items: Region[];
  selected: string | null;
  onSelect: (code: string) => void;
  accent?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <section className="mt-8">
      <h2
        className={`mb-3 text-sm font-semibold uppercase tracking-wide ${
          accent ? "text-emerald-700" : "text-slate-500"
        }`}
      >
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((r) => {
          const active = r.code === selected;
          return (
            <button
              key={r.code}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(r.code)}
              className={`rounded-xl border px-4 py-4 text-left text-base font-medium transition ${
                active
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600"
                  : accent
                  ? "border-emerald-200 bg-white hover:border-emerald-500"
                  : "border-slate-200 bg-white hover:border-slate-400"
              }`}
            >
              {r.name}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function Home() {
  const { lang, region, setRegion, t } = useApp();
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getRegions(lang)
      .then((data) => {
        if (cancelled) return;
        setRegions(data);
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
  }, [lang]);

  const africa = regions.filter((r) => r.code.endsWith("_africa"));
  const others = regions.filter((r) => !r.code.endsWith("_africa"));
  const selectedName = regions.find((r) => r.code === region)?.name;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">{t.heroTitle}</h1>
      <p className="mt-3 max-w-2xl text-slate-600">{t.heroText}</p>

      {loading && <p className="mt-8 text-slate-500">{t.loading}</p>}
      {error && (
        <p className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {t.apiError}
        </p>
      )}

      {!loading && !error && (
        <>
          <RegionGrid title={t.africa} items={africa} selected={region} onSelect={setRegion} accent />
          <RegionGrid title={t.otherRegions} items={others} selected={region} onSelect={setRegion} />

          <div className="mt-10 flex flex-wrap items-center gap-4">
            {region && selectedName ? (
              <>
                <p className="text-slate-700">
                  {t.selectedRegion} <strong>{selectedName}</strong>
                </p>
                <Link
                  href="/check"
                  className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
                >
                  {t.continue} →
                </Link>
              </>
            ) : (
              <p className="text-slate-500">{t.chooseFirst}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}