import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { adminCatalog } from "@/lib/business-server";
import { listAllPendingOutbox } from "@/lib/wa-outbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const [businesses, pending] = await Promise.all([adminCatalog(), listAllPendingOutbox()]);
  return NextResponse.json({
    ok: true,
    pending,
    devices: businesses.map((b) => ({
      slug: b.slug,
      name: b.name,
      phone: b.phone,
      notifyChannel: b.notifyChannel || "owner",
      waDeviceSeenAt: b.waDeviceSeenAt || "",
    })),
  });
}
