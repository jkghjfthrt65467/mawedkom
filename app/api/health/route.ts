import { hasDatabase, pingDatabase } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const database = hasDatabase() ? await pingDatabase() : false;
    return NextResponse.json({
      ok: true,
      database,
      storage: database ? "postgres" : "files",
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, database: false, error: err instanceof Error ? err.message : "db" },
      { status: 500 },
    );
  }
}
