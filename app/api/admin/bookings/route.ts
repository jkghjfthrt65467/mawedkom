import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { listServerBookings, patchServerBooking } from "@/lib/booking-server";
import type { BookingStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: BookingStatus[] = ["confirmed", "pending", "cancelled", "completed", "no_show"];

export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug") || "";
  const status = url.searchParams.get("status") || "";
  let bookings = await listServerBookings();
  if (slug) bookings = bookings.filter((b) => b.businessSlug === slug);
  if (STATUSES.includes(status as BookingStatus)) {
    bookings = bookings.filter((b) => b.status === status);
  }
  return NextResponse.json({ ok: true, bookings: bookings.slice(0, 400) });
}

export async function PATCH(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  let body: { token?: string; status?: BookingStatus } = {};
  try {
    body = (await req.json()) as { token?: string; status?: BookingStatus };
  } catch {
    body = {};
  }
  const token = String(body.token || "").trim();
  const status = body.status;
  if (!token || !status || !STATUSES.includes(status)) {
    return NextResponse.json({ ok: false, error: "الموعد والحالة مطلوبين." }, { status: 400 });
  }
  const saved = await patchServerBooking(token, { status });
  if (!saved) return NextResponse.json({ ok: false, error: "ما لقينا هالموعد." }, { status: 404 });
  return NextResponse.json({ ok: true, booking: saved });
}
