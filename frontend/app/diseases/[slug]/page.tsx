"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { getDisease, type DiseaseDetail } from "@/lib/diseaseApi";
import {
  ENC,
  PREV_BADGE,
  PREV_KEY,
  URGENCY_BADGE,
  URGENCY_KEY,
  type EncStrings,
} from "@/lib/encyclopedia";

type Status = "loading" | "ok" | "missing" | "error";

function DiseaseDetailInner() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { lang } = useApp();
  const e = ENC[lang];
  const [d, setD] = useState<DiseaseDetail | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;
    getDisease(slug, lang)
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setD(data);
          setStatus("ok");
        } else {
          setStatus("missing");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [slug, lang]);

  const backLink = (
    <Link href="/diseases" className="text-sm font-medium text-emerald-700 hover:underline">
      {e.back}
    </Link>
  );

  if (status === "loading") {
    return <div className="mx-auto max-w-3xl px-4 py-8 text-slate-500">{e.loading}</div>;
  }
  if (status === "missing") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        {backLink}
        <p className="mt-6 text-slate-700">{e.notFound}</p>
      </div>
    );
  }
  if (status === "error" || !d) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        {backLink}
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{e.apiError}</p>
      </div>
    );
  }

  const signGroups: { key: keyof EncStrings; items: DiseaseDetail["symptoms"] }[] = [
    { key: "signVery", items: d.symptoms.filter((s) => s.weight >= 0.7) },
    { key: "signCommon", items: d.symptoms.filter((s) => s.weight >= 0.4 && s.weight < 0.7) },
    { key: "signSometimes", items: d.symptoms.filter((s) => s.weight < 0.4) },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {backLink}

      <h1 className="mt-4 text-3xl font-bold">{d.name}</h1>
      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <span>{d.category}</span>
        <span>·</span>
        <span>{e.urgencyLabel}:</span>
        <span className={`rounded-full px-2 py-0.5 text-xs ${URGENCY_BADGE[d.urgency]}`}>
          {e[URGENCY_KEY[d.urgency]]}
        </span>
      </p>

      <p className="mt-5 text-lg text-slate-800">{d.description}</p>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">{e.causeTitle}</h2>
        <p className="mt-1 text-slate-700">{d.cause}</p>
        <h2 className="mt-4 font-semibold">{e.preventionTitle}</h2>
        <p className="mt-1 text-slate-700">{d.prevention}</p>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">{e.signsTitle}</h2>
        <div className="mt-2 space-y-3">
          {signGroups.map(
            (g) =>
              g.items.length > 0 && (
                <div key={g.key}>
                  <p className="text-sm font-medium text-slate-600">{e[g.key]}</p>
                  <ul className="mt-1 flex flex-wrap gap-2">
                    {g.items.map((s) => (
                      <li key={s.slug} className="rounded-full bg-slate-100 px-3 py-1 text-sm">
                        {s.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ),
          )}
        </div>
        <p className="mt-3 text-xs text-slate-500">{e.signsNote}</p>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">{e.regionsTitle}</h2>
        <ul className="mt-2 flex flex-wrap gap-2">
          {d.regions.map((r) => (
            <li key={r.code} className={`rounded-full px-3 py-1 text-sm ${PREV_BADGE[r.prevalence]}`}>
              {r.name} · {e[PREV_KEY[r.prevalence]]}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Link
          href="/check"
          className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
        >
          {e.checkCta}
        </Link>
        <a
          href={d.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-emerald-700 hover:underline"
        >
          {e.sourceLabel} ↗
        </a>
      </div>
    </div>
  );
}
export default function DiseaseDetailPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-8 text-slate-500">…</div>}>
      <DiseaseDetailInner />
    </Suspense>
  );
}