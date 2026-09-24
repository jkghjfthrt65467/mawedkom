import assert from "node:assert/strict";
import {
  appointmentDateTimeMs,
  bookingNeedsReminder,
  buildBookingCreatedMessage,
  buildBookingReminderMessage,
  buildOwnerNewBookingMessage,
  buildStaffNewBookingMessage,
  formatIraqiDate,
  formatTime12,
  isInReminderWindow,
  REMINDER_LEAD_MS,
  timePeriodAr,
} from "../lib/booking-message.ts";
import { teamCalendarUrl } from "../lib/booking-token.ts";
import type { BookingRecord } from "../lib/types.ts";

const rec: BookingRecord = {
  id: "nb-test",
  manageToken: "token123",
  businessSlug: "rafidain-barber",
  businessName: "حلاقة الرافدين",
  serviceName: "قص شعر",
  serviceNames: ["قص شعر"],
  staffName: "حسن العبودي",
  date: "2026-09-17",
  time: "10:00",
  durationMin: 30,
  priceIqd: 15000,
  customerName: "أحمد علي",
  customerPhone: "07701112233",
  status: "confirmed",
  createdAt: "2026-09-17T05:00:00.000Z",
};

const manageUrl = "http://127.0.0.1:3001/m/token123";
const ownerCalendar = "http://127.0.0.1:3001/business/manage/calendar?date=2026-09-17&id=nb-test";
const staffCalendar = "http://127.0.0.1:3001/staff?date=2026-09-17&id=nb-test";

const owner = buildOwnerNewBookingMessage(rec, ownerCalendar);
assert.match(owner, /طلب حجز جديد/);
assert.match(owner, /أحمد علي/);
assert.match(owner, /07701112233/);
assert.match(owner, /قص شعر/);
assert.match(owner, /حلاقة الرافدين/);
assert.match(owner, /2026\/09\/17/);
assert.match(owner, /صباحاً/);
assert.match(owner, /افتح التقويم حتى تشوف الموعد/);
assert.match(owner, /\/business\/manage\/calendar\?date=2026-09-17/);
assert.doesNotMatch(owner, /\/m\/token123/);
assert.equal(teamCalendarUrl("owner", rec, "http://127.0.0.1:3001"), ownerCalendar);
assert.equal(teamCalendarUrl("staff", rec, "http://127.0.0.1:3001"), staffCalendar);

const staffMsg = buildStaffNewBookingMessage(rec, staffCalendar);
assert.match(staffMsg, /وصل موعد جديد على تقويمك/);
assert.match(staffMsg, /\/staff\?date=2026-09-17/);
assert.equal(formatIraqiDate(rec.date), "2026/09/17");
assert.equal(timePeriodAr("10:00"), "صباحاً");
assert.equal(timePeriodAr("16:30"), "مساءً");
assert.equal(formatTime12("10:00"), "10:00 ص");
assert.equal(formatTime12("16:30"), "4:30 م");
assert.equal(formatTime12("22:00", "long"), "10:00 مساءً");
assert.equal(formatTime12("00:15"), "12:15 ص");

const reminder = buildBookingReminderMessage(rec, manageUrl);
assert.match(reminder, /تذكير بالموعد/);
assert.match(reminder, /عزيزي أحمد علي/);
assert.match(reminder, /موعدك بعد ساعتين/);
assert.match(reminder, /الخدمات: قص شعر/);
assert.match(reminder, /المكان: حلاقة الرافدين/);
assert.match(reminder, /التاريخ: 2026\/09\/17/);
assert.match(reminder, /الوقت: 10:00 صباحاً/);
assert.match(reminder, /\/m\/token123/);

const customer = buildBookingCreatedMessage(rec, manageUrl);
assert.match(customer, /تم إنشاء الموعد/);
assert.doesNotMatch(customer, /طلب حجز جديد/);

const appt = appointmentDateTimeMs("2026-09-17", "10:00");
assert.equal(appt, Date.parse("2026-09-17T10:00:00+03:00"));
assert.equal(new Date(appt!).toISOString(), "2026-09-17T07:00:00.000Z");

const twoHoursBefore = appt! - REMINDER_LEAD_MS;
assert.equal(isInReminderWindow(rec.date, rec.time, twoHoursBefore), true);
assert.equal(isInReminderWindow(rec.date, rec.time, twoHoursBefore - 1), false);
assert.equal(isInReminderWindow(rec.date, rec.time, appt! - 1), true);
assert.equal(isInReminderWindow(rec.date, rec.time, appt!), false);
assert.equal(isInReminderWindow(rec.date, rec.time, appt! + 1), false);

assert.equal(bookingNeedsReminder(rec, twoHoursBefore), true);
assert.equal(bookingNeedsReminder({ ...rec, status: "cancelled" }, twoHoursBefore), false);
assert.equal(bookingNeedsReminder({ ...rec, status: "pending" }, twoHoursBefore), false);
assert.equal(bookingNeedsReminder({ ...rec, reminderSentAt: "2026-09-17T06:00:00.000Z" }, twoHoursBefore), false);
assert.equal(bookingNeedsReminder(rec, appt! + 60_000), false);

const evening = appointmentDateTimeMs("2026-09-17", "4:30 مساء");
assert.equal(evening, Date.parse("2026-09-17T16:30:00+03:00"));

console.log("ok — owner + reminder builders and 2h Baghdad window");
console.log("\n--- رسالة صاحب المشروع ---\n");
console.log(owner);
console.log("\n--- تذكير الزبون ---\n");
console.log(reminder);
