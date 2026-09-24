"use client";

import { useState } from "react";

export function OtpPhoneForm({
  submitLabel,
  onVerified,
  extra,
}: {
  submitLabel: string;
  onVerified: (phone: string) => void;
  extra?: React.ReactNode;
}) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [hint, setHint] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string; sent?: boolean; demoCode?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "ما قدرنا نرسل الرمز.");
        return;
      }
      setSent(true);
      setHint(data.demoCode ? `واتساب مو مربوط. رمز التجربة: ${data.demoCode}` : data.message || "انرسل الرمز على واتساب.");
    } catch {
      setError("السيرفر ما رد.");
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!sent) {
      void sendCode();
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; verified?: boolean };
      if (!res.ok || !data.verified) {
        setError(data.error || "الرمز غلط أو منتهي.");
        return;
      }
      onVerified(phone.replace(/\s/g, ""));
    } catch {
      setError("السيرفر ما رد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={verify} className="grid gap-3">
      {extra}
      <label className="grid gap-1 text-sm">
        رقم الهاتف العراقي
        <input
          className="rounded-2xl border border-line px-3 py-3"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="07xxxxxxxxx"
          dir="ltr"
          required
        />
      </label>
      {sent && (
        <label className="grid gap-1 text-sm">
          رمز واتساب
          <input
            className="rounded-2xl border border-line px-3 py-3"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="0000"
            inputMode="numeric"
            dir="ltr"
            required
          />
        </label>
      )}
      {hint && <p className="text-xs leading-6 text-muted">{hint}</p>}
      {error && <p className="text-sm text-terracotta">{error}</p>}
      <button className="nubo-btn nubo-btn-primary" disabled={busy}>
        {busy ? "لحظة…" : sent ? submitLabel : "أرسل رمز واتساب"}
      </button>
      {sent && (
        <button type="button" className="text-sm text-palm" disabled={busy} onClick={() => void sendCode()}>
          أعد الإرسال
        </button>
      )}
    </form>
  );
}
