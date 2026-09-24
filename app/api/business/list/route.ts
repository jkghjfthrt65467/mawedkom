import { publicCatalog } from "@/lib/business-server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const businesses = await publicCatalog();
  return NextResponse.json({ ok: true, businesses });
}
