import { NextResponse } from "next/server";
import { issueOtp, verifyOtp } from "@/lib/otp-server";
import { gatewaySend } from "@/lib/whatsapp-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: Record<string, string> = {};
  try {
    body = (await req.json()) as Record<string, string>;
  } catch {
    body = {};
  }
  const phone = String(body.phone || "").replace(/\s/g, "");
  const codeIn = String(body.code || "").trim();
  if (!/^07\d{9}$/.test(phone)) {
    return NextResponse.json({ ok: false, error: "رقم عراقي: 07 و11 مرتبة." }, { status: 400 });
  }
  if (codeIn) {
    const ok = await verifyOtp(phone, codeIn);
    if (!ok) return NextResponse.json({ ok: false, error: "الرمز غلط أو منتهي." }, { status: 400 });
    return NextResponse.json({ ok: true, verified: true });
  }
  const { code } = await issueOtp(phone);
  const sent = await gatewaySend(phone, `رمز دخول موعدكم: ${code}\nصالح عشر دقائق.`);
  return NextResponse.json({
    ok: true,
    sent: sent.ok,
    message: sent.ok ? "انرسل الرمز على واتساب." : sent.message,
    demoCode: sent.ok ? undefined : code,
  });
}
