import { occupiesSlot, staffByRef, staffCanDoServices, validateBookingSlot } from "@/lib/availability";
import { combinedDuration, combinedPrice, servicesForNames } from "@/lib/services";
import { authorizeBookingWrite, parseBookingActor } from "@/lib/booking-auth";
import { getManagedBusinessFromDisk, saveManagedBusinessToDisk } from "@/lib/business-server";
import { prepareMetaBookingCharge } from "@/lib/billing";
import { upsertCustomer } from "@/lib/customers-server";
import { listServerBookings, upsertServerBooking } from "@/lib/booking-server";
import { createManageToken, originFromRequest } from "@/lib/booking-token";
import { ensureFreeTrial, monthBookingCount, planBlocksNewBookings, planOf, quotaMessage, quotaReached } from "@/lib/plans";
import { MANAGED_SLUG } from "@/lib/store-constants";
import type { BookingRecord, BookingSource, BookingStatus } from "@/lib/types";
import { notifyNewBookingOnServer } from "@/lib/whatsapp-server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: BookingStatus[] = ["confirmed", "pending", "cancelled", "completed", "no_show"];
const SOURCES: BookingSource[] = ["public", "walkin", "phone", "staff"];

function asBooking(body: unknown): BookingRecord | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Partial<BookingRecord>;
  if (!b.businessSlug || !b.businessName || !b.customerName) return null;
  const status = STATUSES.includes(b.status as BookingStatus) ? (b.status as BookingStatus) : "confirmed";
  const source = SOURCES.includes(b.source as BookingSource) ? (b.source as BookingSource) : "public";
  return {
    id: b.id || `nb-${Date.now()}`,
    manageToken: b.manageToken || createManageToken(),
    businessSlug: String(b.businessSlug),
    businessName: String(b.businessName),
    serviceName: String(b.serviceName || ""),
    serviceNames: Array.isArray(b.serviceNames) ? b.serviceNames.map(String) : undefined,
    staffId: b.staffId ? String(b.staffId) : undefined,
    staffName: String(b.staffName || ""),
    date: String(b.date || ""),
    time: String(b.time || ""),
    durationMin: Number(b.durationMin || 0),
    priceIqd: Number(b.priceIqd || 0),
    customerName: String(b.customerName),
    customerPhone: String(b.customerPhone || ""),
    status,
    source,
    createdAt: b.createdAt || new Date().toISOString(),
    reminderSentAt: b.reminderSentAt,
    reminder24SentAt: b.reminder24SentAt,
    notes: b.notes ? String(b.notes) : undefined,
    seriesId: b.seriesId ? String(b.seriesId) : undefined,
    sessionIndex: typeof b.sessionIndex === "number" ? b.sessionIndex : undefined,
    sessionTotal: typeof b.sessionTotal === "number" ? b.sessionTotal : undefined,
  };
}

async function slotError(rec: BookingRecord): Promise<string | null> {
  if (!occupiesSlot(rec.status)) return null;
  const biz = await getManagedBusinessFromDisk(rec.businessSlug || MANAGED_SLUG);
  if (!biz) return null;
  const picked = servicesForNames(biz.services, rec.serviceNames, rec.serviceName);
  const duration = combinedDuration(picked, rec.durationMin);
  rec.durationMin = duration;
  if (picked.length) rec.priceIqd = combinedPrice(picked);
  const staff = staffByRef(biz, rec.staffId, rec.staffName);
  if (picked.length && !staffCanDoServices(staff, picked.map((s) => s.id))) {
    return "هذا الموظف ما يقدر يسوي كل الخدمات المختارة بهالموعد.";
  }
  const existing = await listServerBookings();
  const check = validateBookingSlot(
    biz,
    {
      date: rec.date,
      time: rec.time,
      durationMin: duration,
      staffId: rec.staffId,
      staffName: rec.staffName,
      ignoreBookingId: rec.id,
      ignoreToken: rec.manageToken,
    },
    existing,
  );
  return check.ok ? null : check.reason;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  let bookings = await listServerBookings();
  if (slug) bookings = bookings.filter((b) => b.businessSlug === slug);
  return NextResponse.json({ ok: true, bookings });
}

export async function POST(req: Request) {
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const rec = asBooking(body);
  if (!rec) {
    return NextResponse.json({ ok: false, error: "بيانات الموعد ناقصة." }, { status: 400 });
  }
  const existingList = await listServerBookings();
  const existing = existingList.find((b) => b.manageToken === rec.manageToken || b.id === rec.id) || null;
  const auth = await authorizeBookingWrite({
    actor: parseBookingActor(body),
    current: existing,
    next: rec,
  });
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  const conflict = await slotError(rec);
  if (conflict) {
    return NextResponse.json({ ok: false, error: conflict }, { status: 409 });
  }
  if (!existing && occupiesSlot(rec.status)) {
    const biz = await getManagedBusinessFromDisk(rec.businessSlug || MANAGED_SLUG);
    if (biz) {
      const stamped = ensureFreeTrial(biz);
      if (stamped.freeStartedAt !== biz.freeStartedAt || stamped.freeUsed !== biz.freeUsed) {
        await saveManagedBusinessToDisk(stamped);
      }
      const trialBlock = planBlocksNewBookings(stamped);
      if (trialBlock) {
        return NextResponse.json({ ok: false, error: trialBlock }, { status: 402 });
      }
      const used = monthBookingCount(existingList, rec.businessSlug);
      if (quotaReached(stamped, used)) {
        return NextResponse.json({ ok: false, error: quotaMessage(planOf(stamped)) }, { status: 402 });
      }
      const billed = prepareMetaBookingCharge(stamped);
      if (billed.error) {
        return NextResponse.json({ ok: false, error: billed.error }, { status: 402 });
      }
      if (billed.chargeUsd > 0 || billed.business.metaMonthKey !== biz.metaMonthKey || billed.business.metaWalletUsd !== biz.metaWalletUsd) {
        await saveManagedBusinessToDisk(billed.business);
      }
    }
  }
  const { booking: saved, isNew } = await upsertServerBooking(rec);
  if (isNew && saved.customerPhone) {
    try {
      await upsertCustomer(saved.businessSlug, {
        phone: saved.customerPhone,
        name: saved.customerName,
        bumpVisit: true,
      });
    } catch {
      /* CRM is best-effort */
    }
  }
  let whatsapp: Awaited<ReturnType<typeof notifyNewBookingOnServer>> | undefined;
  if (isNew) {
    const extra = body && typeof body === "object" ? (body as { ownerNotifyPhone?: string; silent?: boolean }) : {};
    if (extra.silent) {
      whatsapp = {
        customer: { ok: true, skipped: true, message: "جلسة لاحقة بدون إشعار." },
        owner: { ok: true, skipped: true, message: "جلسة لاحقة بدون إشعار." },
        staff: { ok: true, skipped: true, message: "جلسة لاحقة بدون إشعار." },
      };
    } else {
      try {
        whatsapp = await notifyNewBookingOnServer(saved, {
          ownerNotifyPhone: extra.ownerNotifyPhone,
          baseUrl: originFromRequest(req),
        });
      } catch {
        whatsapp = {
          customer: { ok: false, message: "فشل إرسال واتساب للزبون." },
          owner: { ok: false, message: "فشل إرسال واتساب لصاحب المشروع." },
          staff: { ok: false, message: "فشل إرسال واتساب للموظف." },
        };
      }
    }
  }
  return NextResponse.json({ ok: true, booking: saved, isNew, whatsapp });
}
