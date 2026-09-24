import { NextResponse } from "next/server";
import { getManagedBusinessFromDisk, saveManagedBusinessToDisk } from "@/lib/business-server";
import { channelForPlan, ensureFreeTrial, normalizePlanId, planOf } from "@/lib/plans";
import { MANAGED_SLUG } from "@/lib/store-constants";
import type { Business } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") || MANAGED_SLUG;
  const business = await getManagedBusinessFromDisk(slug);
  return NextResponse.json({ ok: true, business });
}

export async function POST(req: Request) {
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "بيانات المشروع ناقصة." }, { status: 400 });
  }
  const patch = body as Business;
  if (!patch.slug || !patch.name) {
    return NextResponse.json({ ok: false, error: "اسم المشروع مطلوب." }, { status: 400 });
  }
  const current = await getManagedBusinessFromDisk(patch.slug);
  const next: Business = {
    ...(current || patch),
    ...patch,
    planId: current?.planId,
    requestedPlanId: normalizePlanId(patch.requestedPlanId) || current?.requestedPlanId || current?.planId,
  };
  const stamped = ensureFreeTrial(next);
  next.planId = stamped.planId;
  next.freeStartedAt = stamped.freeStartedAt;
  next.freeUsed = stamped.freeUsed;
  next.notifyChannel = next.notifyChannel || channelForPlan(planOf(next));
  if (next.staffWhatsAppEnabled == null) next.staffWhatsAppEnabled = current?.staffWhatsAppEnabled !== false;
  const limit = planOf(next).staffLimit;
  if (limit != null && next.staff.length > limit && next.staff.length > (current?.staff.length || 0)) {
    return NextResponse.json(
      { ok: false, error: `خطتك (${planOf(next).name}) تسمح بـ ${limit} موظف. رقّي الخطة حتى تضيف أكثر.` },
      { status: 402 },
    );
  }
  const saved = await saveManagedBusinessToDisk(next);
  return NextResponse.json({ ok: true, business: saved });
}
