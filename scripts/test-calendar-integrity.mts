import assert from "node:assert/strict";
import {
  firstFreeStaff,
  holidayInfo,
  rangesOverlap,
  slotsForBusiness,
  validateBookingSlot,
  weekdayHoursFromLegacy,
  workingSlots,
} from "../lib/availability.ts";
import { addDaysIso, isoInBaghdad, saturdayOfWeek, weekDates } from "../lib/calendar.ts";
import type { BookingRecord, Business } from "../lib/types.ts";

const biz: Business = {
  slug: "rafidain-barber",
  name: "حلاقة الرافدين",
  category: "barber",
  city: "baghdad",
  district: "الكرادة",
  address: "بغداد",
  phone: "07701234567",
  about: "",
  rating: 5,
  reviewCount: 1,
  accent: "#ff7802",
  coverTone: "",
  hours: [
    { days: "السبت — الخميس", open: "09:00", close: "22:00" },
    { days: "الجمعة", open: "14:00", close: "22:00" },
  ],
  services: [{ id: "cut", name: "قص شعر", durationMin: 30, priceIqd: 15000 }],
  staff: [
    { id: "hassan", name: "حسن العبودي", role: "حلاق", initials: "ح ع", serviceIds: ["cut"] },
    { id: "ali", name: "علي الجبوري", role: "حلاق", initials: "ع ج", serviceIds: ["cut"] },
    { id: "omar", name: "عمر الكاظمي", role: "حلاق", initials: "ع ك", serviceIds: ["cut"], bookingPaused: true },
  ],
  reviews: [],
  galleryLabels: [],
  weeklyOffDays: [5],
  holidayDates: ["2026-09-20"],
};
biz.weekdayHours = weekdayHoursFromLegacy(biz.hours);

const hassan = biz.staff[0];
const ali = biz.staff[1];
const omar = biz.staff[2];

const existing: BookingRecord[] = [
  {
    id: "b1",
    manageToken: "t1",
    businessSlug: biz.slug,
    businessName: biz.name,
    serviceName: "قص شعر",
    staffId: hassan.id,
    staffName: hassan.name,
    date: "2026-09-17",
    time: "10:00",
    durationMin: 30,
    priceIqd: 15000,
    customerName: "أحمد",
    customerPhone: "07701112233",
    status: "confirmed",
    createdAt: "2026-09-17T05:00:00.000Z",
  },
];

assert.equal(rangesOverlap(600, 630, 610, 640), true);
assert.equal(rangesOverlap(600, 630, 630, 660), false);

const clash = validateBookingSlot(
  biz,
  { date: "2026-09-17", time: "10:00", durationMin: 30, staffId: hassan.id, staffName: hassan.name },
  existing,
);
assert.equal(clash.ok, false);

const overlapPartial = validateBookingSlot(
  biz,
  { date: "2026-09-17", time: "10:15", durationMin: 30, staffId: hassan.id, staffName: hassan.name },
  existing,
);
assert.equal(overlapPartial.ok, false);

const otherStaff = validateBookingSlot(
  biz,
  { date: "2026-09-17", time: "10:00", durationMin: 30, staffId: ali.id, staffName: ali.name },
  existing,
);
assert.equal(otherStaff.ok, true);

const after = validateBookingSlot(
  biz,
  { date: "2026-09-17", time: "10:30", durationMin: 30, staffId: hassan.id, staffName: hassan.name },
  existing,
);
assert.equal(after.ok, true);

const cancelledFree = validateBookingSlot(
  biz,
  { date: "2026-09-17", time: "10:00", durationMin: 30, staffId: hassan.id, staffName: hassan.name },
  [{ ...existing[0], status: "cancelled" }],
);
assert.equal(cancelledFree.ok, true);

const holiday = holidayInfo(biz, "2026-09-20");
assert.equal(holiday.closed, true);
assert.equal(slotsForBusiness(biz, "2026-09-20", 30, [], hassan).length, 0);

const friday = holidayInfo(biz, "2026-09-18");
assert.equal(friday.closed, true);

const paused = validateBookingSlot(
  biz,
  { date: "2026-09-17", time: "11:00", durationMin: 30, staffId: omar.id, staffName: omar.name },
  [],
);
assert.equal(paused.ok, false);

const hassanSlots = slotsForBusiness(biz, "2026-09-17", 30, existing, hassan);
assert.equal(hassanSlots.includes("10:00"), false);
assert.equal(hassanSlots.includes("10:30"), true);
const daySlots = workingSlots(biz, "2026-09-17", 30);
assert.equal(daySlots.includes("10:00"), true);
assert.equal(daySlots.includes("10:30"), true);

const free = firstFreeStaff(biz, "2026-09-17", "10:00", 30, existing, [hassan, ali]);
assert.equal(free?.id, "ali");

const sat = saturdayOfWeek("2026-09-17");
assert.equal(sat, "2026-09-12");
const week = weekDates("2026-09-17");
assert.equal(week[0], "2026-09-12");
assert.equal(week[6], "2026-09-18");
assert.equal(addDaysIso("2026-09-17", 1), "2026-09-18");
assert.match(isoInBaghdad(), /^\d{4}-\d{2}-\d{2}$/);

console.log("ok — calendar overlap, holidays, paused staff, Baghdad week");
