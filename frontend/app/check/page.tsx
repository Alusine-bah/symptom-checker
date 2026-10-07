"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import SymptomForm from "@/components/SymptomForm";
import Results from "@/components/Results";
import { getRegions, postTriage, type TriageResponse } from "@/lib/api";

type Request = { region: string; age_group: string; sex: string; symptoms: string[] };

export default function CheckPage() {
  const { lang, region, t } = useApp();
  const [mounted, setMounted] = useState(false);
  const [regionName, setRegionName] = useState("");
  const [ageGroup, setAgeGroup] = useState("adult");
  const [sex, setSex] = useState("female");
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<TriageResponse | null>(null);
  const [lastReq, setLastReq] = useState<Request | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!region) return;
    let cancelled = false;
    getRegions(lang)
      .then((list) => {
        if (!cancelled) setRegionName(list.find((r) => r.code === region)?.name ?? "");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [lang, region]);

  // If the language changes while results are showing, fetch them again in the new language.
  useEffect(() => {
    if (!lastReq) return;
    let cancelled = false;
    postTriage({ ...lastReq, lang })
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  async function submit() {
    if (!region || selected.length === 0) return;
    const req: Request = { region, age_group: ageGroup, sex, symptoms: selected };
    setSubmitting(true);
    setError(null);
    try {
      const data = await postTriage({ ...req, lang });
      setResult(data);
      setLastReq(req);
      window.scrollTo({ top: 0 });
    } catch {
      setError(t.apiError);
    } finally {
      setSubmitting(false);
    }
  }

  const backToForm = () => {
    setResult(null);
    setLastReq(null);
  };

  const startOver = () => {
    backToForm();
    setSelected([]);
    window.scrollTo({ top: 0 });
  };

  if (!mounted) return null;

  if (!region) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold">{t.checkTitle}</h1>
        <p className="mt-3 text-slate-600">{t.needRegion}</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
        >
          {t.chooseRegionBtn}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {result ? (
        <Results data={result} onBack={backToForm} onReset={startOver} />
      ) : (
        <>
          <h1 className="text-3xl font-bold">{t.checkTitle}</h1>
          <p className="mt-2 text-slate-600">{t.checkIntro}</p>
          <p className="mt-3 text-sm">
            {t.regionLabel}: <strong>{regionName}</strong>{" "}
            <Link href="/" className="ml-2 text-emerald-700 hover:underline">
              {t.changeRegion}
            </Link>
          </p>
          <div className="mt-6">
            <SymptomForm
              selected={selected}
              setSelected={setSelected}
              ageGroup={ageGroup}
              setAgeGroup={setAgeGroup}
              sex={sex}
              setSex={setSex}
              onSubmit={submit}
              submitting={submitting}
              error={error}
            />
          </div>
        </>
      )}
    </div>
  );
}