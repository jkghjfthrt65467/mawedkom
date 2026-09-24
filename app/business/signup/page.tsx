"use client";

import { useEffect, useState } from "react";
import { CITIES, CATEGORIES } from "@/lib/data";
import { normalizePlanId, planOf } from "@/lib/plans";
import { saveManagedBusiness } from "@/lib/store";
import type { Business, PlanId } from "@/lib/types";

export default function BusinessSignupPage() {
  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<PlanId>("free");
  const [done, setDone] = useState<{ slug: string; pin: string; bookingPath: string; name: string } | null>(null);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("plan");
    const next = normalizePlanId(requested);
    if (next) setPlan(next);
  }, []);

  if (done) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return (
      <div className="nubo-card mx-auto max-w-lg p-8 text-center">
        <h1 className="text-2xl font-bold">مشروعك صار على موعدكم</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          {done.name} انحفظ. رمز لوحة المدير {done.pin}. رابط الحجز ينرسل للزبون بدون قوائم الموقع.
        </p>
        <p className="mt-3 break-all font-mono text-xs text-muted" dir="ltr">
          {origin}
          {done.bookingPath}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <a href="/business/manage" className="nubo-btn nubo-btn-primary">
            لوحة المدير
          </a>
          <a href={done.bookingPath} className="nubo-btn nubo-btn-ghost">
            رابط الحجز
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      className="nubo-card mx-auto grid max-w-lg gap-3 p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setBusy(true);
        try {
          const res = await fetch("/api/business/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, ownerName, phone, city, category, plan }),
          });
          const data = (await res.json()) as {
            ok?: boolean;
            error?: string;
            business?: Business;
            pin?: string;
            bookingPath?: string;
          };
          if (!res.ok || !data.ok || !data.business) {
            setError(data.error || "ما قدرنا نفتح المشروع.");
            return;
          }
          saveManagedBusiness(data.business);
          setDone({
            slug: data.business.slug,
            pin: data.pin || "1234",
            bookingPath: data.bookingPath || `/book/${data.business.slug}`,
            name: data.business.name,
          });
        } catch {
          setError("السيرفر ما رد. جرّب مرة ثانية.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h1 className="text-2xl font-bold">سجّل مشروعك على موعدكم</h1>
      <p className="text-sm text-muted">
        التسجيل يبدأ بتجربة 30 يوم.
        {plan !== "free" ? ` طلبك: ${planOf({ planId: plan }).name} — التفعيل عبر الدعم الفني.` : ""} الزبون يحجز مجاناً.
      </p>
      <input
        required
        placeholder="اسم المشروع"
        className="rounded-2xl border border-line px-3 py-3"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        required
        placeholder="اسم المسؤول"
        className="rounded-2xl border border-line px-3 py-3"
        value={ownerName}
        onChange={(e) => setOwnerName(e.target.value)}
      />
      <input
        required
        placeholder="07xxxxxxxxx"
        className="rounded-2xl border border-line px-3 py-3"
        dir="ltr"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <select className="rounded-2xl border border-line px-3 py-3" required value={city} onChange={(e) => setCity(e.target.value)}>
        <option value="" disabled>
          المدينة
        </option>
        {CITIES.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <select className="rounded-2xl border border-line px-3 py-3" required value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="" disabled>
          نوع المشروع
        </option>
        {CATEGORIES.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-terracotta">{error}</p>}
      <button className="nubo-btn nubo-btn-primary" disabled={busy}>
        {busy ? "نسجّل…" : "سجّل مجاناً"}
      </button>
    </form>
  );
}
