import { getSalonSettings, saveSalonSettings } from "@/lib/salon-server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const salon = await getSalonSettings();
  return NextResponse.json({ ok: true, salon });
}

export async function POST(req: Request) {
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const patch = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const salon = await saveSalonSettings({
    slug: typeof patch.slug === "string" ? patch.slug : undefined,
    name: typeof patch.name === "string" ? patch.name : undefined,
    phone: typeof patch.phone === "string" ? patch.phone : undefined,
    ownerNotifyPhone: typeof patch.ownerNotifyPhone === "string" ? patch.ownerNotifyPhone : undefined,
    reminderEnabled: typeof patch.reminderEnabled === "boolean" ? patch.reminderEnabled : undefined,
  });
  return NextResponse.json({ ok: true, salon });
}
