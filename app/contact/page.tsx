"use client";

import { useState } from "react";

export default function ContactPage() {
  const [done, setDone] = useState(false);
  if (done) {
    return (
      <div className="nubo-card mx-auto max-w-lg p-8 text-center">
        <h1 className="text-2xl font-bold">وصلت رسالتك (محلياً)</h1>
        <p className="mt-2 text-sm text-muted">بعد الربط راح توصّل على بريد الفريق. هسه ماكو إرسال شبكي.</p>
      </div>
    );
  }
  return (
    <form
      className="nubo-card mx-auto grid max-w-lg gap-3 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
      }}
    >
      <h1 className="text-2xl font-bold">تواصل ويا موعدكم</h1>
      <p className="text-sm text-muted">للدعم والشراكات. البريد: hello@mawedkom.com</p>
      <input required placeholder="الاسم" className="rounded-2xl border border-line px-3 py-3" />
      <input required placeholder="الهاتف" className="rounded-2xl border border-line px-3 py-3" dir="ltr" />
      <input placeholder="الإيميل" className="rounded-2xl border border-line px-3 py-3" />
      <textarea required rows={5} placeholder="الرسالة" className="rounded-2xl border border-line px-3 py-3" />
      <button className="nubo-btn nubo-btn-primary">إرسال</button>
    </form>
  );
}
