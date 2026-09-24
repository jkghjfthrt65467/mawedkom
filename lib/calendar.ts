import type { BookingRecord, Staff } from "./types";
import type { Locale } from "./i18n";
import { formatDateLatn } from "./latin-digits";
import { AR_IQ_LATN, CKB_IQ_LATN } from "./locale";

function dateLocale(locale: Locale = "ar") {
  return locale === "ckb" ? CKB_IQ_LATN : AR_IQ_LATN;
}

const IRAQ_TZ = "Asia/Baghdad";

export const STAFF_PALETTE = ["#ff7802", "#1d4ed8", "#0f766e", "#7c3aed", "#be123c", "#a16207", "#0e7490", "#4338ca"];

export function isoInBaghdad(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IRAQ_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function clockInBaghdad(date = new Date()): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: IRAQ_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value || "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value || "0");
  return { hour, minute };
}

export function addDaysIso(iso: string, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const dt = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days));
  const y = dt.getUTCFullYear();
  const mo = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

/** Iraqi week starts Saturday. */
export function saturdayOfWeek(iso: string): string {
  const dt = new Date(`${iso}T12:00:00+03:00`);
  const weekday = dt.getDay();
  const sinceSat = (weekday + 1) % 7;
  return addDaysIso(iso, -sinceSat);
}

export function weekDates(iso: string): string[] {
  const start = saturdayOfWeek(iso);
  return Array.from({ length: 7 }, (_, i) => addDaysIso(start, i));
}

export function monthGrid(iso: string): string[] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return weekDates(iso);
  const first = `${m[1]}-${m[2]}-01`;
  const start = saturdayOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDaysIso(start, i));
}

export function monthLabelAr(iso: string, locale: Locale = "ar"): string {
  const dt = new Date(`${iso}T12:00:00+03:00`);
  return formatDateLatn(dt, { month: "long", year: "numeric", timeZone: IRAQ_TZ }, dateLocale(locale));
}

export function dayLabelAr(iso: string, style: "short" | "long" = "short", locale: Locale = "ar"): string {
  const dt = new Date(`${iso}T12:00:00+03:00`);
  return formatDateLatn(
    dt,
    {
      weekday: style,
      day: "numeric",
      month: style === "long" ? "long" : "short",
      timeZone: IRAQ_TZ,
    },
    dateLocale(locale),
  );
}

export function weekdayNameAr(iso: string, locale: Locale = "ar"): string {
  const dt = new Date(`${iso}T12:00:00+03:00`);
  return dt.toLocaleDateString(dateLocale(locale), { weekday: "long", timeZone: IRAQ_TZ });
}

export function staffColor(staff: Pick<Staff, "id" | "calendarColor">, index = 0): string {
  if (staff.calendarColor) return staff.calendarColor;
  const seed = staff.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return STAFF_PALETTE[(seed + index) % STAFF_PALETTE.length];
}

export function visibleOnCalendar(rec: BookingRecord): boolean {
  return rec.status !== "cancelled";
}

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return `rgba(255, 120, 2, ${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
