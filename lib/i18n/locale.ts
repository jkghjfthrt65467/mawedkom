export const LOCALES = ["ar", "ckb"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_KEY = "mawedkom-locale";

export const LOCALE_HTML: Record<Locale, string> = {
  ar: "ar-IQ-u-nu-latn",
  ckb: "ckb-IQ-u-nu-latn",
};

export function isLocale(value: unknown): value is Locale {
  return value === "ar" || value === "ckb";
}

export function parseLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function detectBrowserLocale(languages: readonly string[]): Locale {
  const blob = languages.join(",").toLowerCase();
  if (/(^|,|\s)(ckb|ku)([-_]|$)/.test(blob) || blob.includes("kurdish") || blob.includes("sorani")) {
    return "ckb";
  }
  return DEFAULT_LOCALE;
}

export function applyLocale(locale: Locale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = LOCALE_HTML[locale];
  document.documentElement.dir = "rtl";
  document.cookie = `${LOCALE_KEY}=${locale};path=/;max-age=31536000;samesite=lax`;
}

export function readStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    return isLocale(window.localStorage.getItem(LOCALE_KEY)) ? (window.localStorage.getItem(LOCALE_KEY) as Locale) : null;
  } catch {
    return null;
  }
}

export function resolveInitialLocale(): Locale {
  const saved = readStoredLocale();
  if (saved) return saved;
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language || ""];
  return detectBrowserLocale(langs);
}

export function persistLocale(locale: Locale) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCALE_KEY, locale);
  applyLocale(locale);
}

export function getLocale(): Locale {
  return resolveInitialLocale();
}

export const LOCALE_BOOT_SCRIPT = `try{if(localStorage.getItem("nubo-theme")==="dark")document.documentElement.classList.add("dark");var k=${JSON.stringify(LOCALE_KEY)};var s=localStorage.getItem(k);if(s!=="ar"&&s!=="ckb"){var nav=(navigator.languages||[navigator.language||""]).join(",").toLowerCase();s=/(^|,|\\s)(ckb|ku)([-_]|$)|kurdish|sorani/.test(nav)?"ckb":"ar";localStorage.setItem(k,s)}document.cookie=k+"="+s+";path=/;max-age=31536000;samesite=lax";document.documentElement.lang=s==="ckb"?"ckb-IQ-u-nu-latn":"ar-IQ-u-nu-latn";document.documentElement.dir="rtl"}catch(e){}`;
