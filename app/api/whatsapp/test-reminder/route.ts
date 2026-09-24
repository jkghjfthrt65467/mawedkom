import { bookingNeedsReminder, buildBookingReminderMessage } from "@/lib/booking-message";
import { getServerBookingByToken, listServerBookings, patchServerBooking } from "@/lib/booking-server";
import { manageAppointmentUrl, originFromRequest } from "@/lib/booking-token";
import { sendReminderOnServer } from "@/lib/whatsapp-server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sends a customer reminder immediately (skips the 1-hour window).
 * Body: { token?: string } — uses that booking, else the first confirmed upcoming one.
 */
export async function POST(req: Request) {
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const token = body && typeof body === "object" ? String((body as { token?: string }).token || "") : "";
  const origin = originFromRequest(req);
  const rec = token
    ? await getServerBookingByToken(token)
    : (await listServerBookings()).find((b) => b.status === "confirmed" && b.customerPhone) || null;
  if (!rec) {
    return NextResponse.json({ ok: false, error: "ماكو موعد مؤكد نرسل عليه تذكير." }, { status: 404 });
  }
  if (rec.status === "cancelled") {
    return NextResponse.json({ ok: false, error: "الموعد ملغى — ما نرسل تذكير." }, { status: 400 });
  }
  const result = await sendReminderOnServer(rec, { baseUrl: origin });
  if (result.ok) {
    await patchServerBooking(rec.manageToken, { reminderSentAt: new Date().toISOString() });
  }
  return NextResponse.json({
    ok: result.ok,
    skipped: result.skipped,
    message: result.message,
    jid: result.jid,
    booking: rec,
    reminderText: buildBookingReminderMessage(rec, manageAppointmentUrl(rec.manageToken, origin)),
    wouldBeDueNow: bookingNeedsReminder({ ...rec, reminderSentAt: undefined }, Date.now()),
    note: "هذا مسار تجريبي يرسل فوراً ويتخطى نافذة الساعة.",
  });
}
