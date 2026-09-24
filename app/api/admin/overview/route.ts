import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { adminBusinessRow, todayKey } from "@/lib/admin-view";
import { listServerBookings } from "@/lib/booking-server";
import { adminCatalog } from "@/lib/business-server";
import { listAllCustomers } from "@/lib/customers-server";
import { hasDatabase, pingDatabase } from "@/lib/db";
import { listAllWaitlist } from "@/lib/waitlist-server";
import { listAllPendingOutbox } from "@/lib/wa-outbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const [businesses, bookings, customers, waitlist, pendingWa] = await Promise.all([
    adminCatalog(),
    listServerBookings(),
    listAllCustomers(),
    listAllWaitlist(),
    listAllPendingOutbox(),
  ]);

  const today = todayKey();
  const rows = businesses.map((b) => adminBusinessRow(b, bookings));
  const database = hasDatabase() ? await pingDatabase() : false;

  return NextResponse.json({
    ok: true,
    storage: database ? "postgres" : "files",
    database,
    counts: {
      businesses: rows.length,
      featured: rows.filter((r) => r.featured && !r.hidden).length,
      paused: rows.filter((r) => r.bookingIntakePaused).length,
      hidden: rows.filter((r) => r.hidden).length,
      pendingPlans: rows.filter((r) => r.pending).length,
      expiredTrials: rows.filter((r) => r.trialExpired).length,
      bookings: bookings.length,
      bookingsToday: bookings.filter((b) => b.date === today && b.status !== "cancelled").length,
      bookingsPending: bookings.filter((b) => b.status === "pending").length,
      customers: customers.length,
      waitlist: waitlist.length,
      outboxPending: pendingWa.length,
    },
    pendingPlans: rows.filter((r) => r.pending),
    flagged: rows.filter((r) => r.bookingIntakePaused || r.hidden || r.trialExpired),
    recentBookings: bookings.slice(0, 8),
  });
}
