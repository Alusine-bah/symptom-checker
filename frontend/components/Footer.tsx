"use client";

import { useApp } from "./AppProvider";

export default function Footer() {
  const { t } = useApp();
  return (
    <footer className="border-t border-slate-200 bg-white">
      <p className="mx-auto max-w-5xl px-4 py-4 text-xs text-slate-500">{t.disclaimer}</p>
    </footer>
  );
}