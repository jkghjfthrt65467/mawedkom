import { toLatinDigits } from "../latin-digits";
import { ar, ckb, type Messages } from "./messages";
import { DEFAULT_LOCALE, getLocale, parseLocale, type Locale } from "./locale";

export type { Locale } from "./locale";
export {
  DEFAULT_LOCALE,
  LOCALE_BOOT_SCRIPT,
  LOCALE_HTML,
  LOCALE_KEY,
  applyLocale,
  detectBrowserLocale,
  getLocale,
  isLocale,
  parseLocale,
  persistLocale,
  readStoredLocale,
  resolveInitialLocale,
} from "./locale";
export { ar, ckb } from "./messages";

export type Vars = Record<string, string | number>;

export function messagesOf(locale: Locale | string | null | undefined): Messages {
  return parseLocale(locale) === "ckb" ? ckb : ar;
}

function lookup(dict: unknown, path: string): unknown {
  let cur: unknown = dict;
  for (const part of path.split(".")) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

export function interpolate(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, key: string) => (vars[key] == null ? `{${key}}` : toLatinDigits(vars[key])));
}

export function t(locale: Locale | string | null | undefined, key: string, vars?: Vars): string {
  const dict = messagesOf(locale);
  const hit = lookup(dict, key);
  const fallback = lookup(ar, key);
  const text = typeof hit === "string" ? hit : typeof fallback === "string" ? fallback : key;
  return interpolate(text, vars);
}

export function faqOf(locale: Locale | string | null | undefined) {
  return messagesOf(locale).faq;
}

export function cityLabel(locale: Locale | string | null | undefined, slug: string): string {
  return t(locale, `city.${slug}`) === `city.${slug}` ? slug : t(locale, `city.${slug}`);
}

export function categoryLabel(locale: Locale | string | null | undefined, slug: string): string {
  return t(locale, `cat.${slug}`) === `cat.${slug}` ? slug : t(locale, `cat.${slug}`);
}

export function categoryBlurb(locale: Locale | string | null | undefined, slug: string): string {
  return t(locale, `catBlurb.${slug}`);
}

export function weekdayLabel(locale: Locale | string | null | undefined, weekday: number): string {
  return t(locale, `weekday.${weekday}`);
}

export function statusLabel(locale: Locale | string | null | undefined, status: string): string {
  return t(locale, `status.${status}`);
}

export function sourceLabel(locale: Locale | string | null | undefined, source?: string): string {
  return t(locale, `source.${source || "public"}`);
}

export function planName(locale: Locale | string | null | undefined, id: string): string {
  return t(locale, `plan.${id}`);
}

export function planBlurb(locale: Locale | string | null | undefined, id: string): string {
  return t(locale, `plan.${id}Blurb`);
}

export function currentLocale(): Locale {
  return getLocale();
}
