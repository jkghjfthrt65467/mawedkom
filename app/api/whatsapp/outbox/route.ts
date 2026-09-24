import { getManagedBusinessFromDisk, saveManagedBusinessToDisk } from "@/lib/business-server";
import { MANAGER_PIN } from "@/lib/store-constants";
import { listPendingOutbox, markOutboxSent, outboxCounts } from "@/lib/wa-outbox";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ownerOk(req: Request) {
  return req.headers.get("x-nubo-role") === "owner" && req.headers.get("x-nubo-pin") === MANAGER_PIN;
}

export async function GET(req: Request) {
  if (!ownerOk(req)) {
    return NextResponse.json({ ok: false, error: "صلاحية المدير مطلوبة." }, { status: 401 });
  }
  const slug = new URL(req.url).searchParams.get("slug") || "";
  if (!slug) return NextResponse.json({ ok: false, error: "المشروع ناقص." }, { status: 400 });
  const pending = await listPendingOutbox(slug);
  const counts = await outboxCounts(slug);
  const biz = await getManagedBusinessFromDisk(slug);
  return NextResponse.json({
    ok: true,
    pending,
    counts,
    deviceSeenAt: biz?.waDeviceSeenAt || "",
    notifyChannel: biz?.notifyChannel || "owner",
  });
}

export async function POST(req: Request) {
  if (!ownerOk(req)) {
    return NextResponse.json({ ok: false, error: "صلاحية المدير مطلوبة." }, { status: 401 });
  }
  let body: { slug?: string; action?: string; ids?: string[] } = {};
  try {
    body = (await req.json()) as { slug?: string; action?: string; ids?: string[] };
  } catch {
    body = {};
  }
  const slug = String(body.slug || "").trim();
  if (!slug) return NextResponse.json({ ok: false, error: "المشروع ناقص." }, { status: 400 });

  if (body.action === "heartbeat") {
    const biz = await getManagedBusinessFromDisk(slug);
    if (biz) {
      await saveManagedBusinessToDisk({ ...biz, waDeviceSeenAt: new Date().toISOString() });
    }
    const counts = await outboxCounts(slug);
    return NextResponse.json({ ok: true, counts, deviceSeenAt: new Date().toISOString() });
  }

  if (body.action === "sent") {
    const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
    const changed = await markOutboxSent(slug, ids);
    return NextResponse.json({ ok: true, marked: changed });
  }

  return NextResponse.json({ ok: false, error: "أمر غير معروف." }, { status: 400 });
}
