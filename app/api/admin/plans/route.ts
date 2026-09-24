import { adminCatalog, saveManagedBusinessToDisk } from "@/lib/business-server";
import { requireAdmin } from "@/lib/admin-auth";
import { applyAdminPlanChange, normalizePlanId, planOf } from "@/lib/plans";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const businesses = (await adminCatalog()).map((b) => ({
    slug: b.slug,
    name: b.name,
    phone: b.phone,
    planId: planOf(b).id,
    planName: planOf(b).name,
    requestedPlanId: normalizePlanId(b.requestedPlanId) || planOf(b).id,
    requestedPlanName: planOf({ planId: normalizePlanId(b.requestedPlanId) || planOf(b).id }).name,
    pending: Boolean(normalizePlanId(b.requestedPlanId) && normalizePlanId(b.requestedPlanId) !== planOf(b).id),
  }));
  return NextResponse.json({ ok: true, businesses });
}

export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  let body: { slug?: string; planId?: string } = {};
  try {
    body = (await req.json()) as { slug?: string; planId?: string };
  } catch {
    body = {};
  }
  const slug = String(body.slug || "").trim();
  const planId = normalizePlanId(body.planId);
  if (!slug || !planId) {
    return NextResponse.json({ ok: false, error: "المشروع والخطة مطلوبين." }, { status: 400 });
  }
  const current = (await adminCatalog()).find((b) => b.slug === slug);
  if (!current) {
    return NextResponse.json({ ok: false, error: "ما لقينا هالمشروع." }, { status: 404 });
  }
  const changed = applyAdminPlanChange(current, planId);
  if (changed.error) {
    return NextResponse.json({ ok: false, error: changed.error }, { status: 402 });
  }
  const saved = await saveManagedBusinessToDisk({
    ...changed.business,
    requestedPlanId: planId,
  });
  return NextResponse.json({ ok: true, business: saved });
}
