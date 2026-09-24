import { parseLocale, t, type Locale } from "./i18n";
import type { BookingRecord } from "./types";

function locOf(rec?: Pick<BookingRecord, "locale"> | Locale | null): Locale {
  if (!rec) return "ar";
  if (typeof rec === "string") return parseLocale(rec);
  return parseLocale(rec.locale);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function bookingServiceNames(rec: Pick<BookingRecord, "serviceName"> & { serviceNames?: string[] }): string[] {
  if (rec.serviceNames?.length) return rec.serviceNames.filter(Boolean);
  return rec.serviceName ? [rec.serviceName] : [];
}

export function formatServiceList(names: string[], locale: Locale = "ar"): string {
  const clean = names.map((n) => n.trim()).filter(Boolean);
  if (clean.length === 0) return t(locale, "common.service");
  const and = t(locale, "common.and");
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} ${and}${clean[1]}`;
  return `${clean.slice(0, -1).join("، ")} ${and}${clean[clean.length - 1]}`;
}

export function formatIraqiDate(dateIso: string): string {
  const raw = (dateIso || "").trim();
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    return `${m[1]}/${m[2]}/${m[3]}`;
  }
  const fallback = new Date(raw);
  if (!Number.isNaN(fallback.getTime())) {
    return `${fallback.getFullYear()}/${pad2(fallback.getMonth() + 1)}/${pad2(fallback.getDate())}`;
  }
  return raw;
}

export function parseBookingHour(time: string): number {
  const t = (time || "").trim();
  const match = t.match(/(\d{1,2})[:.](\d{2})/);
  let hour = match ? Number(match[1]) : 0;
  const isPm = /مساء|pm\b/i.test(t);
  const isAm = /صباح|am\b/i.test(t);
  if (isPm && hour < 12) hour += 12;
  if (isAm && hour === 12) hour = 0;
  return hour;
}

export function timePeriodAr(time: string, locale: Locale = "ar"): string {
  return parseBookingHour(time) < 12 ? t(locale, "time.amLong") : t(locale, "time.pmLong");
}

export function formatClock12(time: string): string {
  const match = (time || "").trim().match(/(\d{1,2})[:.](\d{2})/);
  const minutes = match ? match[2] : "00";
  const hour24 = parseBookingHour(time);
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return `${hour12}:${minutes}`;
}

export function formatTime12(time: string, style: "short" | "long" = "short", locale: Locale = "ar"): string {
  const raw = (time || "").trim();
  if (!raw || raw === "مغلق" || raw === t(locale, "time.closed")) return raw === "مغلق" ? t(locale, "time.closed") : raw;
  const clock = formatClock12(raw);
  return style === "long"
    ? `${clock} ${timePeriodAr(raw, locale)}`
    : `${clock} ${parseBookingHour(raw) < 12 ? t(locale, "time.am") : t(locale, "time.pm")}`;
}

export function formatHoursRange(open: string, close: string, locale: Locale = "ar"): string {
  if (!open || open === "مغلق" || close === "مغلق") return t(locale, "time.closed");
  return `${formatTime12(open, "short", locale)} — ${formatTime12(close, "short", locale)}`;
}

export function formatAppointmentWhen(dateIso: string, time: string, locale: Locale = "ar"): string {
  return `${formatIraqiDate(dateIso)} ${t(locale, "time.atHour")} ${formatTime12(time, "long", locale)}`;
}

export function statusLabelAr(status: BookingRecord["status"], locale: Locale = "ar"): string {
  return t(locale, `status.${status}`);
}

export function sourceLabelAr(source: BookingRecord["source"] | undefined, locale: Locale = "ar"): string {
  return t(locale, `source.${source || "public"}`);
}

export function buildBookingCreatedMessage(rec: BookingRecord, manageUrl: string, locale = locOf(rec)): string {
  const name = rec.customerName.trim() || t(locale, "wa.fallbackCustomer");
  const services = formatServiceList(bookingServiceNames(rec), locale);
  const place = rec.businessName.trim() || t(locale, "wa.fallbackPlace");
  const when = formatAppointmentWhen(rec.date, rec.time, locale);
  return [
    t(locale, "wa.createdTitle"),
    "",
    t(locale, "wa.dear", { name }),
    t(locale, "wa.createdOk"),
    "",
    t(locale, "wa.confirmedAt", { services }),
    t(locale, "wa.atPlace", { place }),
    "",
    t(locale, "wa.when", { when }),
    "",
    t(locale, "wa.manage"),
    manageUrl,
  ].join("\n");
}

export function buildBookingCancelledMessage(rec: BookingRecord, locale = locOf(rec)): string {
  const name = rec.customerName.trim() || t(locale, "wa.fallbackCustomer");
  const services = formatServiceList(bookingServiceNames(rec), locale);
  const place = rec.businessName.trim() || t(locale, "wa.fallbackPlace");
  const when = formatAppointmentWhen(rec.date, rec.time, locale);
  return [
    t(locale, "wa.cancelledTitle"),
    "",
    t(locale, "wa.dear", { name }),
    t(locale, "wa.cancelledBody", { services, place }),
    t(locale, "wa.wasWhen", { when }),
  ].join("\n");
}

export const IRAQ_TZ = "Asia/Baghdad";
export const IRAQ_OFFSET = "+03:00";
export const REMINDER_LEAD_MS = 60 * 60 * 1000;
export const REMINDER_24H_MS = 24 * 60 * 60 * 1000;

export function parseBookingClock(time: string): { hour: number; minute: number } {
  const match = (time || "").trim().match(/(\d{1,2})[:.](\d{2})/);
  const minute = match ? Number(match[2]) : 0;
  return {
    hour: parseBookingHour(time),
    minute: Number.isFinite(minute) ? minute : 0,
  };
}

/** Appointment instant in Asia/Baghdad (Iraq has no DST; UTC+3). */
export function appointmentDateTimeMs(dateIso: string, time: string): number | null {
  const raw = (dateIso || "").trim();
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const { hour, minute } = parseBookingClock(time);
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return null;
  const iso = `${m[1]}-${m[2]}-${m[3]}T${pad2(hour)}:${pad2(minute)}:00${IRAQ_OFFSET}`;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}

export function isInReminderWindow(
  dateIso: string,
  time: string,
  nowMs = Date.now(),
  leadMs = REMINDER_LEAD_MS,
): boolean {
  const appt = appointmentDateTimeMs(dateIso, time);
  if (appt == null) return false;
  return nowMs >= appt - leadMs && nowMs < appt;
}

export function bookingNeedsReminder(
  rec: Pick<BookingRecord, "status" | "date" | "time"> & { reminderSentAt?: string },
  nowMs = Date.now(),
): boolean {
  if (rec.status !== "confirmed") return false;
  if (rec.reminderSentAt) return false;
  return isInReminderWindow(rec.date, rec.time, nowMs, REMINDER_LEAD_MS);
}

export function bookingNeeds24hReminder(
  rec: Pick<BookingRecord, "status" | "date" | "time"> & { reminder24SentAt?: string },
  nowMs = Date.now(),
): boolean {
  if (rec.status !== "confirmed") return false;
  if (rec.reminder24SentAt) return false;
  const appt = appointmentDateTimeMs(rec.date, rec.time);
  if (appt == null) return false;
  const lead = REMINDER_24H_MS;
  const window = 3 * 60 * 60 * 1000;
  return nowMs >= appt - lead && nowMs < appt - lead + window && nowMs < appt;
}

export function buildOwnerNewBookingMessage(rec: BookingRecord, calendarUrl: string, locale = locOf(rec)): string {
  return buildTeamNewBookingMessage(rec, calendarUrl, "owner", locale);
}

export function buildStaffNewBookingMessage(rec: BookingRecord, calendarUrl: string, locale = locOf(rec)): string {
  return buildTeamNewBookingMessage(rec, calendarUrl, "staff", locale);
}

export function buildTeamNewBookingMessage(
  rec: BookingRecord,
  calendarUrl: string,
  audience: "owner" | "staff" = "owner",
  locale = locOf(rec),
): string {
  const name = rec.customerName.trim() || t(locale, "wa.fallbackCustomer");
  const phone = rec.customerPhone.trim() || "—";
  const services = formatServiceList(bookingServiceNames(rec), locale);
  const place = rec.businessName.trim() || t(locale, "wa.fallbackPlace");
  const date = formatIraqiDate(rec.date);
  const clock = formatTime12(rec.time, "long", locale);
  const intro = audience === "staff" ? t(locale, "wa.newStaff") : t(locale, "wa.newOwner");
  return [
    t(locale, "wa.newTitle"),
    "",
    intro,
    "",
    t(locale, "wa.customer", { name }),
    t(locale, "wa.phone", { phone }),
    t(locale, "wa.services", { services }),
    t(locale, "wa.place", { place }),
    t(locale, "wa.date", { date }),
    t(locale, "wa.clock", { clock }),
    rec.staffName ? t(locale, "wa.staff", { name: rec.staffName }) : "",
    "",
    t(locale, "wa.openCal"),
    calendarUrl,
  ]
    .filter((line, i, all) => line !== "" || all[i - 1] !== "")
    .join("\n");
}

export function buildWaitlistFreedMessage(
  input: {
    businessName: string;
    date: string;
    time: string;
    bookUrl: string;
    locale?: Locale;
  },
): string {
  const locale = locOf(input.locale);
  return [
    t(locale, "wa.waitTitle"),
    "",
    t(locale, "wa.waitBody", {
      time: formatTime12(input.time, "long", locale),
      date: formatIraqiDate(input.date),
      place: input.businessName,
    }),
    t(locale, "wa.waitCta"),
    input.bookUrl,
  ].join("\n");
}

export function buildBookingReminderMessage(
  rec: BookingRecord,
  manageUrl: string,
  lead: "1h" | "24h" = "1h",
  locale = locOf(rec),
): string {
  const name = rec.customerName.trim() || t(locale, "wa.fallbackCustomer");
  const services = formatServiceList(bookingServiceNames(rec), locale);
  const place = rec.businessName.trim() || t(locale, "wa.fallbackPlace");
  const date = formatIraqiDate(rec.date);
  const clock = formatTime12(rec.time, "long", locale);
  return [
    t(locale, "wa.remindTitle"),
    "",
    t(locale, "wa.dear", { name }),
    lead === "24h" ? t(locale, "wa.remind24") : t(locale, "wa.remind1"),
    "",
    t(locale, "wa.services", { services }),
    t(locale, "wa.place", { place }),
    t(locale, "wa.date", { date }),
    t(locale, "wa.clock", { clock }),
    "",
    t(locale, "wa.manage"),
    manageUrl,
  ].join("\n");
}
