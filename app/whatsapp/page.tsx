"use client";

import Link from "next/link";

export default function WhatsAppPage() {
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <header className="space-y-2">
        <p className="text-sm font-semibold text-gold">واتساب صاحب المشروع</p>
        <h1 className="text-3xl font-bold">الإرسال من جهازك</h1>
        <p className="leading-8 text-muted">
          إذا مفعّل واتساب رقمك، الرسائل ما تنرسل من سيرفر موعدكم. تننتظر على تطبيق أندرويد، والجهاز يرسلها من واتسابك
          أول ما يصير عنده نت.
        </p>
      </header>
      <section className="nubo-card space-y-3 p-5">
        <Link href="/business/manage/whatsapp" className="nubo-btn nubo-btn-primary">
          فتح قسم واتساب بضبط المدير
        </Link>
        <p className="text-sm leading-7 text-muted">
          من هناك تشوف الطابور، حالة التطبيق، وخطوات تشغيله على أندرويد.
        </p>
      </section>
    </div>
  );
}
