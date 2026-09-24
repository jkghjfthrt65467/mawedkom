import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { listAllWaitlist, removeWaitlist } from "@/lib/waitlist-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const entries = await listAllWaitlist();
  return NextResponse.json({ ok: true, entries });
}

export async function DELETE(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ ok: false, error: "العنصر مطلوب." }, { status: 400 });
  const ok = await removeWaitlist(id);
  if (!ok) return NextResponse.json({ ok: false, error: "ما لقينا هالطلب." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
