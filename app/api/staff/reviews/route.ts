import { getManagedBusinessFromDisk, saveManagedBusinessToDisk } from "@/lib/business-server";
import type { Review } from "@/lib/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    slug?: string;
    staffId?: string;
    author?: string;
    rating?: number;
    text?: string;
  };
  const slug = String(body.slug || "").trim();
  const staffId = String(body.staffId || "").trim();
  const author = String(body.author || "").trim();
  const text = String(body.text || "").trim();
  const rating = Math.min(5, Math.max(1, Math.round(Number(body.rating) || 5)));
  if (!slug || !staffId) return NextResponse.json({ ok: false, error: "الموظف ناقص." }, { status: 400 });
  if (author.length < 2) return NextResponse.json({ ok: false, error: "اكتب اسمك." }, { status: 400 });
  if (text.length < 4) return NextResponse.json({ ok: false, error: "اكتب تعليق أوضح." }, { status: 400 });
  const biz = await getManagedBusinessFromDisk(slug);
  if (!biz) return NextResponse.json({ ok: false, error: "ما لقينا المشروع." }, { status: 404 });
  if (!biz.staff.some((s) => s.id === staffId)) {
    return NextResponse.json({ ok: false, error: "ما لقينا هذا الموظف." }, { status: 404 });
  }
  const now = new Date();
  const review: Review = {
    id: `sr-${Date.now().toString(36)}`,
    author,
    rating,
    date: `${now.getDate()} / ${now.getMonth() + 1} / ${now.getFullYear()}`,
    text,
  };
  const next = {
    ...biz,
    staff: biz.staff.map((s) => (s.id === staffId ? { ...s, reviews: [review, ...(s.reviews || [])] } : s)),
  };
  const saved = await saveManagedBusinessToDisk(next);
  const staff = saved.staff.find((s) => s.id === staffId);
  return NextResponse.json({ ok: true, review, reviews: staff?.reviews || [] });
}
