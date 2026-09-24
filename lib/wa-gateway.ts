import { NextResponse } from "next/server";

export const WA_GATEWAY = process.env.WA_GATEWAY_URL || "http://127.0.0.1:3003";

export async function proxyGateway(path: string, init?: RequestInit) {
  try {
    const res = await fetch(`${WA_GATEWAY}${path}`, {
      ...init,
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        connected: false,
        hasQr: false,
        error: "بوابة واتساب مو شغّالة. من الطرفية: npm run wa",
      },
      { status: 503 },
    );
  }
}
