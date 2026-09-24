"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/components/AuthCard";
import { OtpPhoneForm } from "@/components/OtpPhoneForm";
import { setUser } from "@/lib/store";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  return (
    <AuthCard title="حساب جديد" subtitle="حساب زبون. نأكد الرقم برمز واتساب قبل ما ينحفظ بهالجهاز. صاحب المحل يسجّل من صفحة الأعمال.">
      <OtpPhoneForm
        submitLabel="إنشاء الحساب"
        extra={
          <>
            <label className="grid gap-1 text-sm">
              الاسم
              <input className="rounded-2xl border border-line px-3 py-3" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label className="grid gap-1 text-sm">
              الإيميل (اختياري)
              <input className="rounded-2xl border border-line px-3 py-3" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            {error && <p className="text-sm text-terracotta">{error}</p>}
          </>
        }
        onVerified={(phone) => {
          if (name.trim().length < 2) {
            setError("اكتب اسمك.");
            return;
          }
          setUser({ name: name.trim(), phone, email });
          router.push("/account");
        }}
      />
      <p className="mt-4 text-sm">
        عندك حساب؟{" "}
        <Link href="/login" className="font-semibold text-palm">
          دخول
        </Link>
      </p>
    </AuthCard>
  );
}
