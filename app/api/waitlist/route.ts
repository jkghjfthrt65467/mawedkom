import { NextResponse } from "next/server";
import { addWaitlist, listWaitlist } from "@/lib/waitlist-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") || "";
  if (!slug) return NextResponse.json({ ok: false, customers: [] });
  const entries = await listWaitlist(slug);
  return NextResponse.json({ ok: true, entries });
}

export async function POST(req: Request) {
  let body: Record<string, string> = {};
  try {
    body = (await req.json()) as Record<string, string>;
  } catch {
    body = {};
  }
  const businessSlug = String(body.businessSlug || "");
  const date = String(body.date || "");
  const time = String(body.time || "");
  const customerName = String(body.customerName || "").trim();
  const customerPhone = String(body.customerPhone || "").replace(/\s/g, "");
  if (!businessSlug || !date || !time) return NextResponse.json({ ok: false, error: "الوقت ناقص." }, { status: 400 });
  if (customerName.length < 2) return NextResponse.json({ ok: false, error: "اكتب اسمك." }, { status: 400 });
  if (!/^07\d{9}$/.test(customerPhone)) return NextResponse.json({ ok: false, error: "رقم عراقي: 07 و11 مرتبة." }, { status: 400 });
  const entry = await addWaitlist({
    businessSlug,
    date,
    time,
    customerName,
    customerPhone,
    serviceId: body.serviceId,
    serviceName: body.serviceName,
    staffId: body.staffId,
  });
  return NextResponse.json({ ok: true, entry });
}
