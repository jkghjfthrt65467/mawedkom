import { blankBusiness, saveManagedBusinessToDisk } from "@/lib/business-server";
import { CATEGORIES, CITIES } from "@/lib/data";
import { applyPlanChange, channelForPlan, normalizePlanId, planOf } from "@/lib/plans";
import { MANAGER_PIN } from "@/lib/store-constants";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: Record<string, string> = {};
  try {
    body = (await req.json()) as Record<string, string>;
  } catch {
    body = {};
  }
  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").replace(/\s/g, "");
  const city = String(body.city || "");
  const category = String(body.category || "");
  const ownerName = String(body.ownerName || "").trim();
  const planId = normalizePlanId(body.plan) || "free";
  if (name.length < 2) return NextResponse.json({ ok: false, error: "اكتب اسم المشروع." }, { status: 400 });
  if (!/^07\d{9}$/.test(phone)) return NextResponse.json({ ok: false, error: "رقم عراقي: 07 و11 مرتبة." }, { status: 400 });
  if (!CITIES.some((c) => c.slug === city)) return NextResponse.json({ ok: false, error: "اختار مدينة." }, { status: 400 });
  if (!CATEGORIES.some((c) => c.slug === category)) return NextResponse.json({ ok: false, error: "اختار تصنيف." }, { status: 400 });
  const seed = blankBusiness({ name, phone, city, category, ownerName });
  const started = applyPlanChange({ ...seed, planId: undefined, freeStartedAt: undefined, freeUsed: false }, "free");
  const business = await saveManagedBusinessToDisk({
    ...started.business,
    requestedPlanId: planId,
    notifyChannel: channelForPlan(planOf({ planId: started.business.planId })),
  });
  return NextResponse.json({ ok: true, business, pin: MANAGER_PIN, bookingPath: `/book/${business.slug}` });
}
