"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { applyLocale, persistLocale, resolveInitialLocale, t as translate, type Locale, type Vars } from "@/lib/i18n";
import { getManagedBusiness, isManagerAuthed, saveManagedBusiness } from "@/lib/store";

type TFn = ((key: string, vars?: Vars) => string) & { locale: Locale };

const LocaleContext = createContext<{ locale: Locale; setLocale: (next: Locale) => void; t: TFn } | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");

  useEffect(() => {
    const next = resolveInitialLocale();
    setLocaleState(next);
    persistLocale(next);
  }, []);

  const value = useMemo(() => {
    const t = ((key: string, vars?: Vars) => translate(locale, key, vars)) as TFn;
    t.locale = locale;
    return {
      locale,
      setLocale: (next: Locale) => {
        setLocaleState(next);
        persistLocale(next);
        if (isManagerAuthed()) {
          const biz = getManagedBusiness();
          if (biz) saveManagedBusiness({ ...biz, locale: next });
        }
      },
      t,
    };
  }, [locale]);

  useEffect(() => {
    applyLocale(locale);
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    const t = ((key: string, vars?: Vars) => translate("ar", key, vars)) as TFn;
    t.locale = "ar";
    return { locale: "ar" as Locale, setLocale: (_: Locale) => {}, t };
  }
  return ctx;
}

export function useT() {
  return useLocale().t;
}
