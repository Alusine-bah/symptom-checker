"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { normalize } from "@/lib/encyclopedia";
import { getMedicines, type MedicineListItem } from "@/lib/medicineApi";
import { MED, STATUS_BADGE } from "@/lib/medicineStrings";

export default function MedicinesPage() {
  const { lang } = useApp();
  const m = MED[lang];
  const [items, setItems] = useState<MedicineListItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMedicines(lang).then((data) => {
      if (cancelled) return;
      setItems(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const list = useMemo(() => {
    const q = normalize(query.trim());
    return items.filter((x) => !q || normalize(x.name).includes(q));
  }, [items, query]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold">{m.title}</h1>
      <p className="mt-2 text-slate-600">{m.intro}</p>
      <p className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">{m.notice}</p>

      <input
        type="search"
        value={query}
        onChange={(ev) => setQuery(ev.target.value)}
        placeholder={m.search}
        aria-label={m.search}
        className="mt-6 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
      />

      {loading && <p className="mt-6 text-slate-500">{m.loading}</p>}
      {!loading && (
        <>
          <p className="mt-4 text-sm text-slate-500">
            {list.length} {m.count}
          </p>
          {list.length === 0 && <p className="mt-4 text-slate-600">{m.noResults}</p>}
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {list.map((x) => (
              <li key={x.slug}>
                <Link
                  href={`/medicines/${x.slug}`}
                  className="block rounded-xl border border-slate-200 bg-white p-3 hover:border-emerald-500"
                >
                  <span className="font-medium">{x.name}</span>
                  <span className="mt-1 block text-xs text-slate-500">{x.summary}</span>
                  <span className="mt-2 flex">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE[x.status]}`}>
                      {m[x.status]}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
