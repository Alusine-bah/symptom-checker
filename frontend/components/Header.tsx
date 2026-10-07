"use client";

import Link from "next/link";
import type { Lang } from "@/lib/api";
import { useApp } from "./AppProvider";

export default function Header() {
  const { lang, setLang, t } = useApp();
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-emerald-700">
          🩺 {t.appName}
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/check" className="hover:text-emerald-700">
            {t.navCheck}
          </Link>
          <Link href="/diseases" className="hover:text-emerald-700">
            {t.navEncyclopedia}
          </Link>
          <label className="flex items-center gap-2">
            <span className="sr-only">{t.language}</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className="rounded border border-slate-300 bg-white px-2 py-1"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </label>
        </nav>
      </div>
    </header>
  );
}