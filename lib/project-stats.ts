import { clockInBaghdad, isoInBaghdad, saturdayOfWeek, addDaysIso } from "./calendar";
import { formatNumber } from "./latin-digits";
import { bookingServiceNames } from "./booking-message";
import type { BookingRecord, BookingStatus, Business, Service, Staff } from "./types";
import { effectivePrice } from "./services";

export type PeriodKey = "today" | "week" | "month" | "all";

export type NamedCount = {
  id: string;
  name: string;
  count: number;
  revenueIqd: number;
};

export type ProjectStats = {
  timezone: "Asia/Baghdad";
  today: string;
  periods: Record<PeriodKey, { count: number; revenueIqd: number }>;
  byStatus: Record<BookingStatus, number>;
  upcoming: number;
  past: number;
  perStaff: NamedCount[];
  perService: NamedCount[];
  estimatedRevenueIqd: number;
};

const STATUSES: BookingStatus[] = ["confirmed", "pending", "cancelled", "completed", "no_show"];

export function formatStatNumber(n: number): string {
  return formatNumber(n);
}

export function countsTowardRevenue(status: BookingStatus): boolean {
  return status === "confirmed" || status === "pending" || status === "completed";
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function bookingInstant(rec: BookingRecord): string {
  return `${rec.date}T${rec.time || "00:00"}`;
}

function nowInstant(now = new Date()): string {
  const clock = clockInBaghdad(now);
  return `${isoInBaghdad(now)}T${pad2(clock.hour)}:${pad2(clock.minute)}`;
}

function inWeek(dateIso: string, today: string): boolean {
  const start = saturdayOfWeek(today);
  const end = addDaysIso(start, 6);
  return dateIso >= start && dateIso <= end;
}

export function lookupServicePrice(services: Service[], name: string): number {
  const hit = services.find((s) => s.name === name);
  if (!hit) return 0;
  return effectivePrice(hit);
}

export function estimatedBookingRevenue(rec: BookingRecord, services: Service[]): number {
  if (!countsTowardRevenue(rec.status)) return 0;
  if (Number(rec.priceIqd) > 0) return Number(rec.priceIqd);
  const names = bookingServiceNames(rec);
  if (names.length === 0) return 0;
  return names.reduce((sum, name) => sum + lookupServicePrice(services, name), 0);
}

function staffKey(rec: BookingRecord, roster: Staff[]): { id: string; name: string } {
  const byId = rec.staffId ? roster.find((s) => s.id === rec.staffId) : undefined;
  if (byId) return { id: byId.id, name: byId.name };
  const byName = rec.staffName ? roster.find((s) => s.name === rec.staffName) : undefined;
  if (byName) return { id: byName.id, name: byName.name };
  return { id: rec.staffId || rec.staffName || "unassigned", name: rec.staffName || "بدون موظف" };
}

export function computeProjectStats(bookings: BookingRecord[], business: Pick<Business, "staff" | "services">, now = new Date()): ProjectStats {
  const today = isoInBaghdad(now);
  const month = today.slice(0, 7);
  const instant = nowInstant(now);
  const emptyPeriod = { count: 0, revenueIqd: 0 };
  const periods: ProjectStats["periods"] = {
    today: { ...emptyPeriod },
    week: { ...emptyPeriod },
    month: { ...emptyPeriod },
    all: { ...emptyPeriod },
  };
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<BookingStatus, number>;
  const staffMap = new Map<string, NamedCount>();
  const serviceMap = new Map<string, NamedCount>();
  let upcoming = 0;
  let past = 0;

  for (const rec of bookings) {
    const revenue = estimatedBookingRevenue(rec, business.services || []);
    const bump = (key: PeriodKey) => {
      periods[key].count += 1;
      periods[key].revenueIqd += revenue;
    };
    bump("all");
    if (rec.date === today) bump("today");
    if (inWeek(rec.date, today)) bump("week");
    if (rec.date.slice(0, 7) === month) bump("month");

    const status = STATUSES.includes(rec.status) ? rec.status : "confirmed";
    byStatus[status] += 1;

    if (bookingInstant(rec) >= instant && rec.status !== "cancelled") upcoming += 1;
    else past += 1;

    const staff = staffKey(rec, business.staff || []);
    const staffRow = staffMap.get(staff.id) || { id: staff.id, name: staff.name, count: 0, revenueIqd: 0 };
    staffRow.count += 1;
    staffRow.revenueIqd += revenue;
    staffMap.set(staff.id, staffRow);

    const names = bookingServiceNames(rec);
    const serviceNames = names.length ? names : ["خدمة غير محددة"];
    for (const name of serviceNames) {
      const id = (business.services || []).find((s) => s.name === name)?.id || name;
      const row = serviceMap.get(id) || { id, name, count: 0, revenueIqd: 0 };
      row.count += 1;
      row.revenueIqd += names.length > 1 ? Math.round(revenue / names.length) : revenue;
      serviceMap.set(id, row);
    }
  }

  const perStaff = [...staffMap.values()].sort((a, b) => b.count - a.count);
  for (const s of business.staff || []) {
    if (!staffMap.has(s.id)) perStaff.push({ id: s.id, name: s.name, count: 0, revenueIqd: 0 });
  }

  return {
    timezone: "Asia/Baghdad",
    today,
    periods,
    byStatus,
    upcoming,
    past,
    perStaff,
    perService: [...serviceMap.values()].sort((a, b) => b.count - a.count),
    estimatedRevenueIqd: periods.all.revenueIqd,
  };
}
