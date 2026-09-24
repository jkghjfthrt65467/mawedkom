"use client";

import { useEffect, useState } from "react";
import { isAdminAuthed, loginAdmin } from "@/lib/store";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setOk(isAdminAuthed());
    setReady(true);
  }, []);

  if (!ready) return <p className="text-muted">نجهّز لوحة الأدمن…</p>;

  if (!ok) {
    return (
      <form
        className="nubo-glass mx-auto grid max-w-md gap-3 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (loginAdmin(pin)) {
            setOk(true);
            setError("");
          } else {
            setError("الرمز غلط. لأدمن الموقع استخدم 9999.");
          }
        }}
      >
        <p className="text-sm text-gold">أدمن الموقع</p>
        <h1 className="text-2xl font-bold">لوحة الأدمن</h1>
        <p className="text-sm leading-7 text-muted">
          تفعيل الخطط من الدعم، ورفع أو حذف صور أي مشروع وموظفيه.
        </p>
        <label className="grid gap-1 text-sm">
          رمز الأدمن
          <input
            className="rounded-2xl border border-line px-3 py-3"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="9999"
            inputMode="numeric"
            dir="ltr"
          />
        </label>
        <p className="text-xs text-muted">النسخة التجريبية: الرمز 9999</p>
        {error && <p className="text-sm text-terracotta">{error}</p>}
        <button className="nubo-btn nubo-btn-primary">دخول كأدمن</button>
      </form>
    );
  }

  return <>{children}</>;
}
