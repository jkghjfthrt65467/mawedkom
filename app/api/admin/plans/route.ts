import { listManagedBusinesses, saveManagedBusinessToDisk } from "@/lib/business-server";
import { applyPlanChange, normalizePlanId, planOf } from "@/lib/plans";
import { actorFromRequest } from "@/lib/upload-server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (actorFromRequest(req) !== "admin") {
    return NextResponse.json({ ok: false, error: "صلاحية الأدمن مطلوبة." }, { status: 401 });
  }
  const businesses = (await listManagedBusinesses()).map((b) => ({
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
  if (actorFromRequest(req) !== "admin") {
    return NextResponse.json({ ok: false, error: "صلاحية الأدمن مطلوبة." }, { status: 401 });
  }
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
  const current = (await listManagedBusinesses()).find((b) => b.slug === slug);
  if (!current) {
    return NextResponse.json({ ok: false, error: "ما لقينا هالمشروع." }, { status: 404 });
  }
  const changed = applyPlanChange(current, planId);
  if (changed.error) {
    return NextResponse.json({ ok: false, error: changed.error }, { status: 402 });
  }
  const saved = await saveManagedBusinessToDisk({
    ...changed.business,
    requestedPlanId: planId,
  });
  return NextResponse.json({ ok: true, business: saved });
}
