import { NextResponse } from "next/server";
import { listCustomers, upsertCustomer } from "@/lib/customers-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") || "";
  if (!slug) return NextResponse.json({ ok: false, error: "slug ناقص" }, { status: 400 });
  const customers = await listCustomers(slug);
  return NextResponse.json({ ok: true, customers });
}

export async function POST(req: Request) {
  let body: Record<string, string> = {};
  try {
    body = (await req.json()) as Record<string, string>;
  } catch {
    body = {};
  }
  const slug = String(body.slug || "");
  const phone = String(body.phone || "");
  if (!slug || !phone) return NextResponse.json({ ok: false, error: "بيانات ناقصة." }, { status: 400 });
  const customer = await upsertCustomer(slug, { phone, name: body.name, notes: body.notes });
  return NextResponse.json({ ok: true, customer });
}
