import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { listAllCustomers, upsertCustomer } from "@/lib/customers-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const customers = await listAllCustomers();
  return NextResponse.json({ ok: true, customers });
}

export async function PATCH(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  let body: { slug?: string; phone?: string; name?: string; notes?: string } = {};
  try {
    body = (await req.json()) as { slug?: string; phone?: string; name?: string; notes?: string };
  } catch {
    body = {};
  }
  const slug = String(body.slug || "").trim();
  const phone = String(body.phone || "").trim();
  if (!slug || !phone) return NextResponse.json({ ok: false, error: "المشروع والرقم مطلوبين." }, { status: 400 });
  const customer = await upsertCustomer(slug, { phone, name: body.name, notes: body.notes });
  return NextResponse.json({ ok: true, customer });
}
