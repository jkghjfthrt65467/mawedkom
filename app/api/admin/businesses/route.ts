import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { adminBusinessRow } from "@/lib/admin-view";
import { topUpWallet, walletOf } from "@/lib/billing";
import { listServerBookings } from "@/lib/booking-server";
import { adminCatalog, deleteManagedBusiness, getManagedBusinessFromDisk, saveManagedBusinessToDisk } from "@/lib/business-server";
import { CITIES, CATEGORIES } from "@/lib/data";
import { applyAdminPlanChange, normalizePlanId } from "@/lib/plans";
import type { ApprovalMode, Business, NotifyChannel } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const bookings = await listServerBookings();
  const businesses = (await adminCatalog()).map((b) => adminBusinessRow(b, bookings));
  return NextResponse.json({
    ok: true,
    businesses,
    cities: CITIES.map((c) => ({ slug: c.slug, name: c.name })),
    categories: CATEGORIES.map((c) => ({ slug: c.slug, name: c.name })),
  });
}

type PatchBody = {
  slug?: string;
  name?: string;
  phone?: string;
  city?: string;
  district?: string;
  address?: string;
  category?: string;
  about?: string;
  featured?: boolean;
  hidden?: boolean;
  bookingIntakePaused?: boolean;
  approvalMode?: ApprovalMode;
  notifyChannel?: NotifyChannel;
  planId?: string;
  walletTopUp?: number;
  walletSet?: number;
};

function asText(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function asBool(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

export async function PATCH(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  let body: PatchBody = {};
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    body = {};
  }
  const slug = String(body.slug || "").trim();
  if (!slug) return NextResponse.json({ ok: false, error: "المشروع مطلوب." }, { status: 400 });

  const current = (await adminCatalog()).find((b) => b.slug === slug) || (await getManagedBusinessFromDisk(slug));
  if (!current) return NextResponse.json({ ok: false, error: "ما لقينا هالمشروع." }, { status: 404 });

  let next: Business = { ...current };
  const name = asText(body.name);
  const phone = asText(body.phone);
  const city = asText(body.city);
  const district = asText(body.district);
  const address = asText(body.address);
  const category = asText(body.category);
  const about = asText(body.about);
  if (name != null) next.name = name.trim() || next.name;
  if (phone != null) next.phone = phone.replace(/\s/g, "");
  if (city != null) next.city = city;
  if (district != null) next.district = district;
  if (address != null) next.address = address;
  if (category != null) next.category = category;
  if (about != null) next.about = about;
  const featured = asBool(body.featured);
  const hidden = asBool(body.hidden);
  const paused = asBool(body.bookingIntakePaused);
  if (featured != null) next.featured = featured;
  if (hidden != null) next.hidden = hidden;
  if (paused != null) next.bookingIntakePaused = paused;
  if (body.approvalMode === "AUTO" || body.approvalMode === "MANUAL") next.approvalMode = body.approvalMode;
  if (body.notifyChannel === "owner" || body.notifyChannel === "meta") next.notifyChannel = body.notifyChannel;

  const planId = normalizePlanId(body.planId);
  if (planId) {
    const changed = applyAdminPlanChange(next, planId);
    if (changed.error) return NextResponse.json({ ok: false, error: changed.error }, { status: 402 });
    next = { ...changed.business, requestedPlanId: planId };
  }

  const topUp = Number(body.walletTopUp);
  if (Number.isFinite(topUp) && topUp > 0) {
    next = topUpWallet(next, topUp);
  }
  const walletSet = Number(body.walletSet);
  if (Number.isFinite(walletSet) && walletSet >= 0 && body.walletSet != null) {
    next = { ...next, metaWalletUsd: Math.round(walletSet * 100) / 100 };
  }

  const saved = await saveManagedBusinessToDisk(next);
  const bookings = await listServerBookings();
  return NextResponse.json({ ok: true, business: adminBusinessRow(saved, bookings), walletUsd: walletOf(saved) });
}

export async function DELETE(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const slug = new URL(req.url).searchParams.get("slug") || "";
  if (!slug) return NextResponse.json({ ok: false, error: "المشروع مطلوب." }, { status: 400 });
  const ok = await deleteManagedBusiness(slug);
  if (!ok) return NextResponse.json({ ok: false, error: "ما قدرنا نحذف المشروع." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
