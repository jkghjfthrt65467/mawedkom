import { bookingNeeds24hReminder, bookingNeedsReminder, buildBookingReminderMessage } from "@/lib/booking-message";
import { listServerBookings, patchServerBooking } from "@/lib/booking-server";
import { manageAppointmentUrl, originFromRequest } from "@/lib/booking-token";
import { getManagedBusinessFromDisk } from "@/lib/business-server";
import { sendViaBusinessChannel } from "@/lib/whatsapp-server";
import { NextResponse } from "next/server";
import type { BookingRecord } from "@/lib/types";
import type { Business } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Due = BookingRecord & {
  reminderKind: "24h" | "1h";
  manageUrl: string;
  reminderText: string;
  reminderField: "reminder24SentAt" | "reminderSentAt";
};

async function collectDue(origin: string): Promise<Due[]> {
  const cache = new Map<string, Business | null>();
  const bizOf = async (slug: string) => {
    if (!cache.has(slug)) cache.set(slug, await getManagedBusinessFromDisk(slug));
    return cache.get(slug) || null;
  };
  const now = Date.now();
  const bookings: Due[] = [];
  for (const b of await listServerBookings()) {
    const biz = await bizOf(b.businessSlug);
    if (biz?.reminderEnabled === false) continue;
    const manageUrl = manageAppointmentUrl(b.manageToken, origin);
    if (bookingNeeds24hReminder(b, now)) {
      bookings.push({
        ...b,
        reminderKind: "24h",
        manageUrl,
        reminderText: buildBookingReminderMessage(b, manageUrl, "24h"),
        reminderField: "reminder24SentAt",
      });
    }
    if (bookingNeedsReminder(b, now)) {
      bookings.push({
        ...b,
        reminderKind: "1h",
        manageUrl,
        reminderText: buildBookingReminderMessage(b, manageUrl, "1h"),
        reminderField: "reminderSentAt",
      });
    }
  }
  return bookings;
}

async function deliver(origin: string) {
  const cache = new Map<string, Business | null>();
  const bizOf = async (slug: string) => {
    if (!cache.has(slug)) cache.set(slug, await getManagedBusinessFromDisk(slug));
    return cache.get(slug) || null;
  };
  const due = await collectDue(origin);
  const sent = [];
  for (const booking of due) {
    if (!booking.customerPhone) continue;
    const biz = await bizOf(booking.businessSlug);
    const result = await sendViaBusinessChannel(biz, booking.customerPhone, booking.reminderText);
    if (result.ok && !result.skipped) {
      await patchServerBooking(booking.manageToken, { [booking.reminderField]: new Date().toISOString() });
    }
    sent.push({ token: booking.manageToken, field: booking.reminderField, ...result });
  }
  return { due: due.length, sent };
}

export async function GET(req: Request) {
  const origin = originFromRequest(req);
  const url = new URL(req.url);
  if (url.searchParams.get("deliver") === "1") {
    const result = await deliver(origin);
    return NextResponse.json({ ok: true, timezone: "Asia/Baghdad", ...result });
  }
  const bookings = await collectDue(origin);
  return NextResponse.json({
    ok: true,
    timezone: "Asia/Baghdad",
    now: new Date().toISOString(),
    reminderEnabled: true,
    bookings,
  });
}

export async function POST(req: Request) {
  const result = await deliver(originFromRequest(req));
  return NextResponse.json({ ok: true, timezone: "Asia/Baghdad", ...result });
}
