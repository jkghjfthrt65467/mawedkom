"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { OtpPhoneForm } from "@/components/OtpPhoneForm";
import { useT } from "@/components/LocaleProvider";
import { getUser, setUser } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const t = useT();

  return (
    <AuthCard title={t("pages.loginTitle")} subtitle={t("pages.loginSub")}>
      <OtpPhoneForm
        submitLabel={t("nav.login")}
        onVerified={(phone) => {
          const existing = getUser();
          setUser(existing?.phone === phone ? existing : { name: existing?.name || "زبون", phone, email: existing?.email || "" });
          router.push("/account");
        }}
      />
      <p className="mt-4 text-sm">
        {t("pages.noAccount")}{" "}
        <Link href="/register" className="font-semibold text-palm">
          {t("pages.createAccount")}
        </Link>
        {" · "}
        <Link href="/forgot" className="text-palm">
          {t("pages.forgot")}
        </Link>
      </p>
    </AuthCard>
  );
}
