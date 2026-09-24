import { NextResponse } from "next/server";
import { actorFromRequest } from "./upload-server";

export function requireAdmin(req: Request): NextResponse | null {
  if (actorFromRequest(req) !== "admin") {
    return NextResponse.json({ ok: false, error: "صلاحية الأدمن مطلوبة." }, { status: 401 });
  }
  return null;
}
