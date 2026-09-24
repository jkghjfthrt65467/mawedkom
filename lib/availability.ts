import type { BookingRecord, BookingStatus, Business, DaySchedule, Staff, WorkingHours } from "./types";

export const ARABIC_WEEKDAYS: { weekday: number; name: string }[] = [
  { weekday: 6, name: "السبت" },
  { weekday: 0, name: "الأحد" },
  { weekday: 1, name: "الاثنين" },
  { weekday: 2, name: "الثلاثاء" },
  { weekday: 3, name: "الأربعاء" },
  { weekday: 4, name: "الخميس" },
  { weekday: 5, name: "الجمعة" },
];

export function weekdayHoursFromLegacy(hours: WorkingHours[]): DaySchedule[] {
  const friday = hours.find((h) => h.days.includes("الجمعة"));
  const fridayClosed = !friday || friday.open === "مغلق";
  const fridayOpen = friday && friday.open !== "مغلق" ? friday.open : "09:00";
  const fridayClose = friday && friday.close !== "مغلق" ? friday.close : "22:00";
  const weekday = hours.find((h) => !h.days.includes("الجمعة")) || hours[0];
  const open = weekday?.open && weekday.open !== "مغلق" ? weekday.open : "09:00";
  const close = weekday?.close && weekday.close !== "مغلق" ? weekday.close : "22:00";
  return [0, 1, 2, 3, 4, 5, 6].map((d) => {
    if (d === 5) {
      return { weekday: 5, closed: fridayClosed, open: fridayOpen, close: fridayClose };
    }
    return { weekday: d, closed: false, open, close };
  });
}

export function hoursSummary(days: DaySchedule[]): WorkingHours[] {
  const name = (n: number) => ARABIC_WEEKDAYS.find((d) => d.weekday === n)?.name || "";
  const keyOf = (d: DaySchedule) => (d.closed ? "مغلق" : `${d.open}-${d.close}`);
  const order = [6, 0, 1, 2, 3, 4, 5];
  const sorted = order.map((w) => days.find((d) => d.weekday === w)).filter(Boolean) as DaySchedule[];
  const groups: WorkingHours[] = [];
  for (const day of sorted) {
    const last = groups[groups.length - 1];
    const label = name(day.weekday);
    const open = day.closed ? "مغلق" : day.open;
    const close = day.closed ? "مغلق" : day.close;
    if (last && keyOf(day) === (last.open === "مغلق" ? "مغلق" : `${last.open}-${last.close}`)) {
      const first = last.days.split(" — ")[0];
      last.days = `${first} — ${label}`;
    } else {
      groups.push({ days: label, open, close });
    }
  }
  return groups;
}

export function holidayInfo(business: Business, dateIso: string): { closed: boolean; reason: string } {
  const d = new Date(`${dateIso}T12:00:00+03:00`);
  if (Number.isNaN(d.getTime())) return { closed: true, reason: "تاريخ غير صالح." };
  const weekday = d.getDay();
  if ((business.holidayDates || []).includes(dateIso)) {
    return { closed: true, reason: "هذا اليوم عطلة محددة — الحجز مغلق." };
  }
  if ((business.weeklyOffDays || []).includes(weekday)) {
    return { closed: true, reason: "هذا اليوم عطلة أسبوعية للمحل." };
  }
  const schedule = (business.weekdayHours || weekdayHoursFromLegacy(business.hours)).find((h) => h.weekday === weekday);
  if (schedule?.closed) {
    return { closed: true, reason: "المحل مغلق بهذا اليوم حسب ساعات العمل." };
  }
  return { closed: false, reason: "" };
}

export function parseHm(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

export function padHm(mins: number) {
  const safe = Math.max(0, mins);
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function timeToMinutes(value: string): number {
  const parsed = parseHm(value);
  if (parsed != null) return parsed;
  const match = (value || "").trim().match(/(\d{1,2})[:.](\d{2})/);
  if (!match) return 0;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const isPm = /مساء|pm\b/i.test(value);
  const isAm = /صباح|am\b/i.test(value);
  if (isPm && hour < 12) hour += 12;
  if (isAm && hour === 12) hour = 0;
  return hour * 60 + minute;
}

export function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function occupiesSlot(status: BookingStatus | undefined): boolean {
  return status === "pending" || status === "confirmed" || status === "completed";
}

export function bookingRange(rec: Pick<BookingRecord, "time" | "durationMin">): { start: number; end: number } {
  const start = timeToMinutes(rec.time);
  const duration = Math.max(5, Number(rec.durationMin) || 30);
  return { start, end: start + duration };
}

export function dayScheduleFor(business: Business, dateIso: string): DaySchedule | undefined {
  const d = new Date(`${dateIso}T12:00:00+03:00`);
  const weekday = Number.isNaN(d.getTime()) ? new Date(`${dateIso}T12:00:00`).getDay() : d.getDay();
  return (business.weekdayHours || weekdayHoursFromLegacy(business.hours)).find((h) => h.weekday === weekday);
}

export function staffDayOff(staff: Staff | undefined, weekday: number): boolean {
  return Boolean(staff?.weeklyOffDays?.includes(weekday));
}

export function dateWeekday(dateIso: string): number {
  const d = new Date(`${dateIso}T12:00:00+03:00`);
  if (Number.isNaN(d.getTime())) return new Date(`${dateIso}T12:00:00`).getDay();
  return d.getDay();
}

export function staffWorkingWindow(business: Business, dateIso: string, staff?: Staff): { start: number; end: number } | null {
  if (holidayInfo(business, dateIso).closed) return null;
  const weekday = dateWeekday(dateIso);
  if (staffDayOff(staff, weekday)) return null;
  if (staff?.weekdayHours?.length) {
    const row = staff.weekdayHours.find((h) => h.weekday === weekday);
    if (!row || row.closed) return null;
    const start = parseHm(row.open || "09:00") ?? 9 * 60;
    const end = parseHm(row.close || "22:00") ?? 22 * 60;
    if (end <= start) return null;
    return { start, end };
  }
  return workingWindow(business, dateIso);
}

export function appointmentBufferMin(business: Business, staff?: Staff): number {
  const n = staff?.bufferMin ?? business.bufferMin ?? 0;
  return Number.isFinite(n) && n > 0 ? Math.min(180, Math.round(n)) : 0;
}

export function workingWindow(business: Business, dateIso: string): { start: number; end: number } | null {
  if (holidayInfo(business, dateIso).closed) return null;
  const schedule = dayScheduleFor(business, dateIso);
  if (!schedule || schedule.closed) return null;
  const start = parseHm(schedule.open || "09:00") ?? 9 * 60;
  const end = parseHm(schedule.close || "22:00") ?? 22 * 60;
  if (end <= start) return null;
  return { start, end };
}

export function gridHours(business: Business): { start: number; end: number } {
  const days = business.weekdayHours || weekdayHoursFromLegacy(business.hours);
  let start = 9 * 60;
  let end = 22 * 60;
  const openDays = days.filter((d) => !d.closed);
  if (openDays.length) {
    start = Math.min(...openDays.map((d) => parseHm(d.open) ?? 9 * 60));
    end = Math.max(...openDays.map((d) => parseHm(d.close) ?? 22 * 60));
  }
  start = Math.max(6 * 60, Math.floor(start / 60) * 60);
  end = Math.min(24 * 60, Math.ceil(end / 60) * 60);
  if (end <= start) return { start: 9 * 60, end: 22 * 60 };
  return { start, end };
}

export function staffByRef(business: Business, staffId?: string, staffName?: string): Staff | undefined {
  if (staffId && staffId !== "any") {
    const byId = business.staff.find((s) => s.id === staffId);
    if (byId) return byId;
  }
  const name = (staffName || "").trim();
  if (!name || name === "أي موظف متاح") return undefined;
  return business.staff.find((s) => s.name === name);
}

export function bookingBelongsToStaff(rec: Pick<BookingRecord, "staffId" | "staffName">, staff: Pick<Staff, "id" | "name">): boolean {
  if (rec.staffId && rec.staffId !== "any") return rec.staffId === staff.id;
  return (rec.staffName || "").trim() === staff.name;
}

export type SlotConflict = {
  ok: false;
  reason: string;
};

export type SlotOk = { ok: true };

export function validateBookingSlot(
  business: Business,
  input: {
    date: string;
    time: string;
    durationMin: number;
    staffId?: string;
    staffName?: string;
    ignoreBookingId?: string;
    ignoreToken?: string;
  },
  existing: BookingRecord[],
): SlotOk | SlotConflict {
  const info = holidayInfo(business, input.date);
  if (info.closed) return { ok: false, reason: info.reason || "هذا اليوم عطلة — الحجز مغلق." };

  const staff = staffByRef(business, input.staffId, input.staffName);
  if (!staff) return { ok: false, reason: "اختار موظفاً لهذا الموعد." };
  if (staff.bookingPaused) return { ok: false, reason: "هذا الموظف متوقف عن الحجوزات." };

  const window = staffWorkingWindow(business, input.date, staff);
  if (!window) return { ok: false, reason: "المحل أو هذا الموظف مغلق بهذا اليوم." };

  const start = timeToMinutes(input.time);
  const duration = Math.max(5, Number(input.durationMin) || 30);
  const end = start + duration;
  if (start < window.start || end > window.end) {
    return { ok: false, reason: "الساعة خارج دوام هذا اليوم." };
  }

  const buffer = appointmentBufferMin(business, staff);
  const hit = existing.find((b) => {
    if (b.businessSlug && b.businessSlug !== business.slug) return false;
    if (input.ignoreBookingId && b.id === input.ignoreBookingId) return false;
    if (input.ignoreToken && b.manageToken === input.ignoreToken) return false;
    if (!occupiesSlot(b.status)) return false;
    if (b.date !== input.date) return false;
    if (!bookingBelongsToStaff(b, staff)) return false;
    const other = bookingRange(b);
    const otherStaff = staffByRef(business, b.staffId, b.staffName);
    const otherBuffer = appointmentBufferMin(business, otherStaff);
    return rangesOverlap(start, end + buffer, other.start, other.end + otherBuffer);
  });
  if (hit) {
    return { ok: false, reason: `هذا الوقت محجوز لـ ${staff.name} (${hit.customerName || "زبون"}).` };
  }
  return { ok: true };
}

export function workingSlots(business: Business, dateIso: string, durationMin: number, staff?: Staff): string[] {
  const window = staff ? staffWorkingWindow(business, dateIso, staff) : workingWindow(business, dateIso);
  if (!window) return [];
  const duration = Math.max(5, Number(durationMin) || 30);
  const out: string[] = [];
  for (let t = window.start; t + duration <= window.end; t += 30) {
    out.push(padHm(t));
  }
  return out;
}

export function slotsForBusiness(
  business: Business,
  dateIso: string,
  durationMin: number,
  existing: BookingRecord[] = [],
  staff?: Staff,
  ignore?: { ignoreBookingId?: string; ignoreToken?: string },
): string[] {
  if (staff?.bookingPaused) return [];
  const duration = Math.max(5, Number(durationMin) || 30);
  return workingSlots(business, dateIso, duration, staff).filter((label) => {
    if (!staff) return true;
    return validateBookingSlot(
      business,
      {
        date: dateIso,
        time: label,
        durationMin: duration,
        staffId: staff.id,
        staffName: staff.name,
        ignoreBookingId: ignore?.ignoreBookingId,
        ignoreToken: ignore?.ignoreToken,
      },
      existing,
    ).ok;
  });
}

export function slotsForAnyStaff(
  business: Business,
  dateIso: string,
  durationMin: number,
  existing: BookingRecord[],
  candidates: Staff[],
  ignore?: { ignoreBookingId?: string; ignoreToken?: string },
): string[] {
  const union = new Set<string>();
  for (const staff of candidates) {
    for (const slot of slotsForBusiness(business, dateIso, durationMin, existing, staff, ignore)) {
      union.add(slot);
    }
  }
  return [...union].sort();
}

export function firstFreeStaff(
  business: Business,
  dateIso: string,
  time: string,
  durationMin: number,
  existing: BookingRecord[],
  candidates: Staff[],
  ignore?: { ignoreBookingId?: string; ignoreToken?: string },
): Staff | undefined {
  return candidates.find((staff) => {
    const check = validateBookingSlot(
      business,
      {
        date: dateIso,
        time,
        durationMin,
        staffId: staff.id,
        staffName: staff.name,
        ignoreBookingId: ignore?.ignoreBookingId,
        ignoreToken: ignore?.ignoreToken,
      },
      existing,
    );
    return check.ok;
  });
}

export function openSlotsByStaffDate(
  business: Business,
  durationMin: number,
  existing: BookingRecord[],
  staffList: Staff[],
  dateIsos: string[],
  ignore?: { ignoreBookingId?: string; ignoreToken?: string },
): Record<string, Record<string, string[]>> {
  const out: Record<string, Record<string, string[]>> = {};
  for (const staff of staffList) {
    out[staff.id] = {};
    for (const date of dateIsos) {
      out[staff.id][date] = slotsForBusiness(business, date, durationMin, existing, staff, ignore);
    }
  }
  return out;
}

export function staffCanDoServices(staff: Staff | undefined, serviceIds: string[]) {
  if (!staff || staff.bookingPaused) return false;
  if (!serviceIds.length) return true;
  return serviceIds.every((id) => staff.serviceIds.includes(id));
}

export function bookableStaff(business: Business, serviceId?: string | string[]): Staff[] {
  const ids = (Array.isArray(serviceId) ? serviceId : serviceId ? [serviceId] : []).filter(Boolean);
  return business.staff.filter((s) => {
    if (s.bookingPaused) return false;
    if (ids.length && !ids.every((id) => s.serviceIds.includes(id))) return false;
    return true;
  });
}

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0]} ${parts[1][0]}`;
}
