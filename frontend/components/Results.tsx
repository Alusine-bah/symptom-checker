"use client";

import { useApp } from "./AppProvider";
import type { MatchLabel, TriageResponse, Urgency } from "@/lib/api";
import type { Strings } from "@/lib/i18n";

const URGENCY_STYLE: Record<Urgency, string> = {
  emergency: "border-red-300 bg-red-50 text-red-800",
  urgent: "border-orange-300 bg-orange-50 text-orange-800",
  routine: "border-yellow-300 bg-yellow-50 text-yellow-800",
  self_care: "border-emerald-300 bg-emerald-50 text-emerald-800",
};

const URGENCY_TEXT: Record<Urgency, keyof Strings> = {
  emergency: "urgEmergency",
  urgent: "urgUrgent",
  routine: "urgRoutine",
  self_care: "urgSelfCare",
};

const URGENCY_ICON: Record<Urgency, string> = {
  emergency: "🔴",
  urgent: "🟠",
  routine: "🟡",
  self_care: "🟢",
};

const MATCH_TEXT: Record<MatchLabel, keyof Strings> = {
  strong: "matchStrong",
  moderate: "matchModerate",
  possible: "matchPossible",
};

const MATCH_BAR: Record<MatchLabel, string> = {
  strong: "bg-emerald-600",
  moderate: "bg-sky-500",
  possible: "bg-slate-400",
};

export default function Results({
  data,
  onBack,
  onReset,
}: {
  data: TriageResponse;
  onBack: () => void;
  onReset: () => void;
}) {
  const { t } = useApp();

  const actions = (
    <div className="mt-8 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={onBack}
        className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium hover:bg-slate-100"
      >
        ← {t.editSymptoms}
      </button>
      <button
        type="button"
        onClick={onReset}
        className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium hover:bg-slate-100"
      >
        {t.startOver}
      </button>
    </div>
  );

  if (data.status === "emergency") {
    return (
      <div>
        <div className="rounded-2xl border-2 border-red-500 bg-red-50 p-6">
          <h1 className="text-2xl font-bold text-red-800">🚨 {t.emergencyTitle}</h1>
          {data.message && <p className="mt-3 text-lg text-red-900">{data.message}</p>}
          {data.red_flags && data.red_flags.length > 0 && (
            <div className="mt-4">
              <p className="font-medium text-red-900">{t.dangerSigns}</p>
              <ul className="mt-1 list-disc pl-6 text-red-900">
                {data.red_flags.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {actions}
        <p className="mt-6 text-xs text-slate-500">{data.disclaimer}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">{t.resultsTitle}</h1>

      <div className={`mt-4 rounded-xl border p-4 ${URGENCY_STYLE[data.urgency]}`}>
        <p className="font-semibold">
          {URGENCY_ICON[data.urgency]} {t[URGENCY_TEXT[data.urgency]]}
        </p>
      </div>

      {data.few_symptoms && (
        <p className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
          {t.fewSymptoms}
        </p>
      )}

      {data.results.length === 0 ? (
        <p className="mt-6 rounded-lg border border-slate-200 bg-white p-4 text-slate-700">{t.noMatch}</p>
      ) : (
        <>
          <h2 className="mt-8 font-semibold">{t.possibleCauses}</h2>
          <div className="mt-3 space-y-4">
            {data.results.map((r) => (
              <article key={r.slug} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold">{r.name}</h3>
                  <span className="text-sm font-medium text-slate-600">{t[MATCH_TEXT[r.label]]}</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${MATCH_BAR[r.label]}`}
                    style={{ width: `${Math.max(8, r.match_score)}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-slate-700">{r.description}</p>
                <p className="mt-3 text-sm">
                  <span className="font-medium">{t.youSelected}</span> {r.matched.join(", ")}
                </p>
                {r.missing.length > 0 && (
                  <p className="mt-1 text-sm text-slate-600">
                    <span className="font-medium">{t.alsoCommon}</span> {r.missing.join(", ")}
                  </p>
                )}
                <p className="mt-3 text-sm">
                  <span className="font-medium">{t.prevention}:</span> {r.prevention}
                </p>
                <a
                  href={r.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:underline"
                >
                  {t.source} ↗
                </a>
              </article>
            ))}
          </div>
        </>
      )}

      {actions}
      <p className="mt-6 text-xs text-slate-500">{data.disclaimer}</p>
    </div>
  );
}