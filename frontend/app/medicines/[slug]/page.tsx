"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { getMedicine, type MedicineDetail } from "@/lib/medicineApi";
import { MED, STATUS_BADGE, type MedStrings } from "@/lib/medicineStrings";
import { reportUrl } from "@/lib/report";

type Status = "loading" | "ok" | "missing";

const SECTIONS: { key: keyof MedicineDetail; title: keyof MedStrings }[] = [
  { key: "what_it_is", title: "whatItIs" },
  { key: "used_for", title: "usedFor" },
  { key: "how_used", title: "howUsed" },
  { key: "who_careful", title: "whoCareful" },
  { key: "other_medicines", title: "otherMedicines" },
  { key: "side_effects", title: "sideEffects" },
  { key: "pregnancy", title: "pregnancy" },
  { key: "urgent", title: "urgent" },
  { key: "open_points", title: "openPoints" },
];

function MedicineInner() {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useApp();
  const m = MED[lang];
  const [med, setMed] = useState<MedicineDetail | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;
    getMedicine(slug, lang).then((data) => {
      if (cancelled) return;
      setMed(data);
      setStatus(data ? "ok" : "missing");
    });
    return () => {
      cancelled = true;
    };
  }, [slug, lang]);

  const back = (
    <Link href="/medicines" className="text-sm font-medium text-emerald-700 hover:underline">
      {m.back}
    </Link>
  );

  if (status === "loading") {
    return <div className="mx-auto max-w-3xl px-4 py-8 text-slate-500">{m.loading}</div>;
  }
  if (status === "missing" || !med) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        {back}
        <p className="mt-6 text-slate-700">{m.notFound}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {back}
      <h1 className="mt-4 text-3xl font-bold">{med.name}</h1>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE[med.status]}`}>{m[med.status]}</span>
        <span>
          {m.lastChecked}: {med.last_checked}
        </span>
      </p>

      {med.status === "draft" ? (
        <p role="note" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          {m.draftBanner}
        </p>
      ) : (
        <p role="note" className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
          {m.reviewedBanner}
          {med.reviewed_by ? ` ${m.by} ${med.reviewed_by}` : ""}
          {med.reviewed_on ? ` ${m.on} ${med.reviewed_on}` : ""}
        </p>
      )}
      <p className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">{m.notice}</p>

      {SECTIONS.map(({ key, title }) => {
        const items = med[key] as string[] | undefined;
        if (!items || items.length === 0) return null;
        const urgent = key === "urgent";
        return (
          <section
            key={key}
            className={`mt-6 rounded-xl border p-5 ${
              urgent ? "border-red-200 bg-red-50" : key === "open_points" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"
            }`}
          >
            <h2 className="font-semibold">{m[title]}</h2>
            {items.length === 1 ? (
              <p className="mt-1 text-slate-700">{items[0]}</p>
            ) : (
              <ul className="mt-2 list-disc space-y-2 pl-5 text-slate-700">
                {items.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      {med.diseases.length > 0 && (
        <section className="mt-6">
          <h2 className="font-semibold">{m.relatedTitle}</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {med.diseases.map((d) => (
              <li key={d.slug}>
                <Link
                  href={`/diseases/${d.slug}`}
                  className="block rounded-full bg-slate-100 px-3 py-1 text-sm hover:bg-emerald-100"
                >
                  {d.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6">
        <h2 className="font-semibold">{m.sourcesTitle}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {med.sources.map((s) => (
            <li key={s.title}>
              {s.url ? (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-emerald-700 hover:underline"
                >
                  {s.title} ↗
                </a>
              ) : (
                <span>
                  {s.title} ({m.noLink})
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">{m.reportTitle}</h2>
        <p className="mt-1 text-sm text-slate-600">{m.reportText}</p>
        <a
          href={reportUrl(`Medicine: ${med.name}`, `/medicines/${med.slug}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:underline"
        >
          {m.reportLink}
        </a>
      </section>
    </div>
  );
}

export default function MedicinePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-8 text-slate-500">…</div>}>
      <MedicineInner />
    </Suspense>
  );
}
