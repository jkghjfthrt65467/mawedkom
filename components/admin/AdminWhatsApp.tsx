"use client";

import { useCallback, useEffect, useState } from "react";
import { adminGet } from "@/components/admin/admin-api";
import { formatNumber, toLatinDigits } from "@/lib/latin-digits";
import { showToast } from "@/lib/toast";

type OutboxItem = {
  id: string;
  slug: string;
  phone: string;
  text: string;
  kind: string;
};

type Device = {
  slug: string;
  name: string;
  phone: string;
  notifyChannel: string;
  waDeviceSeenAt: string;
};

export function AdminWhatsApp() {
  const [pending, setPending] = useState<OutboxItem[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  const load = useCallback(async () => {
    const data = await adminGet<{ pending: OutboxItem[]; devices: Device[] }>("/api/admin/whatsapp");
    setPending(data.pending || []);
    setDevices(data.devices || []);
  }, []);

  useEffect(() => {
    void load().catch((err: unknown) => {
      showToast(err instanceof Error ? err.message : "فشل تحميل واتساب.", "err");
    });
  }, [load]);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-xl font-bold">أجهزة المالكين</h2>
        <p className="text-sm text-muted">آخر مرة تطبيق الأندرويد وصل لصندوق الرسائل.</p>
        {devices.length === 0 && <p className="text-sm text-muted">ماكو مشاريع.</p>}
        <div className="space-y-2">
          {devices.map((d) => (
            <article key={d.slug} className="nubo-card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-bold">{d.name}</p>
                <p className="text-xs text-muted" dir="ltr">
                  {d.phone}
                </p>
              </div>
              <p className="text-sm text-muted">{seenLabel(d.waDeviceSeenAt)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">رسائل معلّقة ({formatNumber(pending.length)})</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted">صندوق الإرسال فاضي.</p>
        ) : (
          pending.map((item) => (
            <article key={item.id} className="nubo-card grid gap-2 p-4">
              <p className="text-sm font-semibold">
                {item.slug} · {item.kind}
              </p>
              <p className="text-xs text-muted" dir="ltr">
                {item.phone}
              </p>
              <p className="whitespace-pre-wrap text-sm leading-7">{item.text}</p>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

function seenLabel(iso: string) {
  if (!iso) return "ما اتصل الجهاز";
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms)) return toLatinDigits(iso);
  const min = Math.max(0, Math.floor(ms / 60000));
  if (min < 2) return "متصل هسه";
  if (min < 60) return `قبل ${formatNumber(min)} دقيقة`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `قبل ${formatNumber(hours)} ساعة`;
  return `قبل ${formatNumber(Math.floor(hours / 24))} يوم`;
}
