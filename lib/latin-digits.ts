import { AR_IQ_LATN } from "./locale";

const EASTERN = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";

/** Force 0-9 everywhere, even if a locale or font tried Eastern/Persian digits. */
export function toLatinDigits(value: string | number): string {
  return String(value).replace(/[٠-٩۰-۹]/g, (ch) => {
    const eastern = EASTERN.indexOf(ch);
    if (eastern >= 0) return String(eastern);
    const persian = PERSIAN.indexOf(ch);
    return persian >= 0 ? String(persian) : ch;
  });
}

export function formatNumber(n: number, opts?: Intl.NumberFormatOptions) {
  const value = Number(n);
  return toLatinDigits((Number.isFinite(value) ? value : 0).toLocaleString(AR_IQ_LATN, opts));
}

export function formatDateLatn(
  date: Date,
  opts: Intl.DateTimeFormatOptions,
  locale: string = AR_IQ_LATN,
) {
  return toLatinDigits(date.toLocaleDateString(locale, opts));
}

export function formatTimeLatn(
  date: Date,
  opts: Intl.DateTimeFormatOptions,
  locale: string = AR_IQ_LATN,
) {
  return toLatinDigits(date.toLocaleTimeString(locale, opts));
}
