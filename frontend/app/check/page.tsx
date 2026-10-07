"use client";

import { useApp } from "@/components/AppProvider";

export default function CheckPage() {
  const { t } = useApp();
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">{t.checkTitle}</h1>
      <p className="mt-3 text-slate-600">{t.checkSoon}</p>
    </div>
  );
}