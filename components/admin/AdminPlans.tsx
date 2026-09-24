"use client";

import { useCallback, useEffect, useState } from "react";
import { ADMIN_PIN } from "@/lib/store-constants";
import { showToast } from "@/lib/toast";

type Row = {
  slug: string;
  name: string;
  phone: string;
  planId: string;
  planName: string;
  requestedPlanId: string;
  requestedPlanName: string;
  pending: boolean;
};

export function AdminPlans() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/plans", {
      cache: "no-store",
      headers: { "x-nubo-role": "admin", "x-nubo-pin": ADMIN_PIN },
    });
    const data = (await res.json().catch(() => ({}))) as { businesses?: Row[] };
    setRows(data.businesses || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function activate(row: Row) {
    setBusy(row.slug);
    const res = await fetch("/api/admin/plans", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-nubo-role": "admin",
        "x-nubo-pin": ADMIN_PIN,
      },
      body: JSON.stringify({ slug: row.slug, planId: row.requestedPlanId }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    setBusy("");
    if (!res.ok || !data.ok) {
      showToast(data.error || "ما قدرنا نفعّل الخطة.", "err");
      return;
    }
    showToast(`تم تفعيل ${row.requestedPlanName} لـ ${row.name}`);
    void load();
  }

  const pending = rows.filter((r) => r.pending);
  const rest = rows.filter((r) => !r.pending);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">تفعيل الخطط</h2>
        <p className="mt-1 text-sm leading-7 text-muted">
          صاحب المشروع يغيّر نوع خطته من الضبط. التفعيل حالياً من هني فقط.
        </p>
      </div>
      {pending.length === 0 && rest.length === 0 && <p className="text-sm text-muted">ماكو مشاريع محفوظة بعد.</p>}
      {pending.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gold">بانتظار التفعيل</p>
          {pending.map((row) => (
            <article key={row.slug} className="nubo-card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-bold">{row.name}</p>
                <p className="text-sm text-muted">
                  الحالية: {row.planName} → المطلوبة: {row.requestedPlanName}
                </p>
                {row.phone && (
                  <p className="text-xs text-muted" dir="ltr">
                    {row.phone}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="nubo-btn nubo-btn-primary text-sm"
                disabled={busy === row.slug}
                onClick={() => void activate(row)}
              >
                تفعيل {row.requestedPlanName}
              </button>
            </article>
          ))}
        </div>
      )}
      {rest.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted">المشاريع الفعّالة</p>
          {rest.map((row) => (
            <p key={row.slug} className="text-sm text-muted">
              {row.name} · {row.planName}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
