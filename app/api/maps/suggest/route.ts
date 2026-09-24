import { NextResponse } from "next/server";
import { suggestPlaces } from "@/lib/maps-server";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() || "";
  if (q.length < 2) return NextResponse.json({ ok: true, items: [] });
  try {
    const items = await suggestPlaces(q);
    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json({ ok: false, items: [], error: "search-failed" }, { status: 500 });
  }
}
