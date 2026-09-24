"use client";

import { useLocale } from "@/components/LocaleProvider";

export function LocaleToggle() {
  const { locale, setLocale, t } = useLocale();
  const next = locale === "ar" ? "ckb" : "ar";
  return (
    <button
      type="button"
      className="grid h-11 min-w-11 place-items-center rounded-full border border-line px-3 text-sm font-semibold text-ink"
      aria-label={t("lang.switch")}
      title={t("lang.switch")}
      onClick={() => setLocale(next)}
    >
      {locale === "ar" ? t("lang.ckb") : t("lang.ar")}
    </button>
  );
}
