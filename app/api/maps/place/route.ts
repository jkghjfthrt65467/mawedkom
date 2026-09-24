import { NextResponse } from "next/server";
import { placeDetails } from "@/lib/maps-server";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id")?.trim() || "";
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    const place = await placeDetails(id);
    if (!place) return NextResponse.json({ ok: false }, { status: 404 });
    return NextResponse.json({ ok: true, ...place });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
