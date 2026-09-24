import { occupiesSlot, staffByRef, staffCanDoServices, validateBookingSlot } from "@/lib/availability";
import { combinedDuration, servicesForNames } from "@/lib/services";
import { authorizeBookingWrite, parseBookingActor } from "@/lib/booking-auth";
import { originFromRequest } from "@/lib/booking-token";
import { getManagedBusinessFromDisk } from "@/lib/business-server";
import { getServerBookingByToken, listServerBookings, patchServerBooking } from "@/lib/booking-server";
import { MANAGED_SLUG } from "@/lib/store-constants";
import type { BookingRecord } from "@/lib/types";
import { takeWaitlistForSlot } from "@/lib/waitlist-server";
import { notifyWaitlistFreedOnServer } from "@/lib/whatsapp-server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const booking = await getServerBookingByToken(token);
  if (!booking) {
    return NextResponse.json({ ok: false, error: "ما لقينا هالموعد." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, booking });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const raw = (body && typeof body === "object" ? body : {}) as Partial<BookingRecord> & { actor?: unknown };
  const actor = parseBookingActor(raw);
  const patch = { ...raw } as Partial<BookingRecord> & { actor?: unknown };
  delete patch.actor;
  delete patch.manageToken;
  delete patch.id;

  const current = await getServerBookingByToken(token);
  if (!current) {
    return NextResponse.json({ ok: false, error: "ما لقينا هالموعد." }, { status: 404 });
  }
  const next: BookingRecord = { ...current, ...patch, manageToken: current.manageToken, id: current.id };
  const auth = await authorizeBookingWrite({ actor, current, next });
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  if (occupiesSlot(next.status)) {
    const biz = await getManagedBusinessFromDisk(next.businessSlug || MANAGED_SLUG);
    if (biz) {
      const existing = await listServerBookings();
      const picked = servicesForNames(biz.services, next.serviceNames, next.serviceName);
      const duration = combinedDuration(picked, next.durationMin);
      next.durationMin = duration;
      const staff = staffByRef(biz, next.staffId, next.staffName);
      if (picked.length && !staffCanDoServices(staff, picked.map((s) => s.id))) {
        return NextResponse.json({ ok: false, error: "هذا الموظف ما يقدر يسوي كل الخدمات المختارة بهالموعد." }, { status: 409 });
      }
      const check = validateBookingSlot(
        biz,
        {
          date: next.date,
          time: next.time,
          durationMin: duration,
          staffId: next.staffId,
          staffName: next.staffName,
          ignoreBookingId: next.id,
          ignoreToken: next.manageToken,
        },
        existing,
      );
      if (!check.ok) {
        return NextResponse.json({ ok: false, error: check.reason }, { status: 409 });
      }
    }
  }

  const booking = await patchServerBooking(token, patch);
  if (!booking) {
    return NextResponse.json({ ok: false, error: "ما لقينا هالموعد." }, { status: 404 });
  }
  if (occupiesSlot(current.status) && booking.status === "cancelled") {
    const waiting = await takeWaitlistForSlot(booking.businessSlug, booking.date, booking.time);
    const origin = originFromRequest(req);
    const bookUrl = `${origin}/book/${booking.businessSlug}`;
    await Promise.all(
      waiting.map((entry) =>
        notifyWaitlistFreedOnServer({
          businessName: booking.businessName,
          date: booking.date,
          time: booking.time,
          phone: entry.customerPhone,
          bookUrl,
          businessSlug: booking.businessSlug,
        }),
      ),
    );
  }
  return NextResponse.json({ ok: true, booking });
}

export const PUT = PATCH;
