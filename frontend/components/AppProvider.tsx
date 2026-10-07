"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Lang } from "@/lib/api";
import { UI, type Strings } from "@/lib/i18n";

type AppState = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  region: string | null;
  setRegion: (region: string | null) => void;
  t: Strings;
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [region, setRegionState] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("lang");
      if (savedLang === "en" || savedLang === "fr") setLangState(savedLang);
      const savedRegion = localStorage.getItem("region");
      if (savedRegion) setRegionState(savedRegion);
    } catch {
      // storage unavailable: keep defaults
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem("lang", next);
    } catch {}
  };

  const setRegion = (next: string | null) => {
    setRegionState(next);
    try {
      if (next) localStorage.setItem("region", next);
      else localStorage.removeItem("region");
    } catch {}
  };

  return (
    <AppContext.Provider value={{ lang, setLang, region, setRegion, t: UI[lang] }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}