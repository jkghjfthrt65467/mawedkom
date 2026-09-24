import { NextResponse } from "next/server";
import { reverseAddress } from "@/lib/maps-server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ ok: false, address: "" }, { status: 400 });
  }
  try {
    const address = await reverseAddress(lat, lng);
    return NextResponse.json({ ok: true, address });
  } catch {
    return NextResponse.json({ ok: false, address: "" }, { status: 500 });
  }
}
