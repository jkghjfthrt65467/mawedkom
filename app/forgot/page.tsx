"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { OtpPhoneForm } from "@/components/OtpPhoneForm";
import { getUser, setUser } from "@/lib/store";

export default function ForgotPage() {
  const router = useRouter();

  return (
    <AuthCard title="استعادة الدخول" subtitle="نرسل رمز واتساب لنفس الرقم. بعد التأكيد ترجع لحسابك بهالجهاز.">
      <OtpPhoneForm
        submitLabel="دخول"
        onVerified={(phone) => {
          const existing = getUser();
          setUser(existing?.phone === phone ? existing : { name: existing?.name || "زبون", phone, email: existing?.email || "" });
          router.push("/account");
        }}
      />
      <p className="mt-4 text-sm">
        <Link href="/login" className="text-palm">
          رجوع للدخول
        </Link>
      </p>
    </AuthCard>
  );
}
