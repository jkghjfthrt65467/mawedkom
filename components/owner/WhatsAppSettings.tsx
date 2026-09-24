"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MANAGER_PIN } from "@/lib/store-constants";
import { resolveNotifyChannel } from "@/lib/plans";
import type { Business } from "@/lib/types";

function ago(iso?: string) {
  if (!iso) return "ما اتصل بعد";
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 0) return "الآن";
  const min = Math.floor(ms / 60000);
  if (min < 1) return "الآن";
  if (min < 60) return `قبل ${min} دقيقة`;
  const h = Math.floor(min / 60);
  if (h < 24) return `قبل ${h} ساعة`;
  return `قبل ${Math.floor(h / 24)} يوم`;
}

export function WhatsAppSettings({ biz }: { biz: Business }) {
  const ownerChannel = resolveNotifyChannel(biz) === "owner";
  const [pending, setPending] = useState(0);
  const [seen, setSeen] = useState(biz.waDeviceSeenAt || "");

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const res = await fetch(`/api/whatsapp/outbox?slug=${encodeURIComponent(biz.slug)}`, {
          cache: "no-store",
          headers: { "x-nubo-role": "owner", "x-nubo-pin": MANAGER_PIN },
        });
        const data = (await res.json()) as { counts?: { pending?: number }; deviceSeenAt?: string };
        if (cancelled) return;
        setPending(data.counts?.pending || 0);
        setSeen(data.deviceSeenAt || "");
      } catch {
        /* keep last */
      }
    }
    tick();
    const id = window.setInterval(tick, 8000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [biz.slug]);

  return (
    <div className="space-y-4">
      <div className="nubo-card grid gap-3 p-5">
        <h2 className="text-2xl font-bold">واتساب</h2>
        <p className="text-sm leading-7 text-muted">
          إذا مفعّل الإرسال من رقمك، الرسائل ما تطلع من سيرفر موعدكم. تنحفظ للجهاز، وتطبيق أندرويد يرسلها من واتسابك.
          إذا الجهاز بلا نت، أول ما يرجع النت التطبيق يفرّغ الطابور ويرسل للزبون والموظف.
        </p>
        <p className={`text-sm font-semibold ${ownerChannel ? "text-palm" : "text-muted"}`}>
          {ownerChannel ? "القناة الحالية: واتساب رقمك — الإرسال من جهازك." : "القناة الحالية: نظام إشعارات المنصة."}
        </p>
        {!ownerChannel && (
          <p className="text-sm leading-7 text-muted">
            حتى تشتغل الرسائل من جهازك، اختار «واتساب رقمي» من{" "}
            <Link href="/business/manage/booking" className="font-semibold text-palm">
              الحجز والإشعارات
            </Link>
            .
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="nubo-card p-5">
          <p className="text-xs text-gold">طابور الجهاز</p>
          <p className="mt-1 text-3xl font-bold text-palm">{pending}</p>
          <p className="mt-1 text-sm text-muted">رسالة تنتظر الإرسال من هاتفك</p>
        </article>
        <article className="nubo-card p-5">
          <p className="text-xs text-gold">تطبيق أندرويد</p>
          <p className="mt-1 text-lg font-bold">{seen ? `آخر اتصال ${ago(seen)}` : "الجهاز مو متصل بعد"}</p>
          <p className="mt-1 text-sm text-muted">التطبيق يبلّغ المنصة أول ما يصير عنده نت</p>
        </article>
      </div>

      <div className="nubo-card space-y-3 p-5">
        <h3 className="text-lg font-bold">تطبيق أندرويد</h3>
        <ol className="space-y-2 text-sm leading-7">
          <li>
            <span className="font-bold text-palm">1.</span> ثبّت تطبيق موعدكم على هاتف صاحب المشروع من{" "}
            <code dir="ltr">apps/owner-android</code>.
          </li>
          <li>
            <span className="font-bold text-palm">2.</span> اكتب رابط الموقع الحي (رابط Render) ورمز المشروع{" "}
            <code dir="ltr">{biz.slug}</code> ورمز المدير <code dir="ltr">{MANAGER_PIN}</code>.
          </li>
          <li>
            <span className="font-bold text-palm">3.</span> خلّ واتساب مثبت على نفس الجهاز. أول ما يرجع النت، التطبيق
            يرسل الرسائل من رقمك، مو من سيرفر موعدكم.
          </li>
        </ol>
      </div>
    </div>
  );
}
