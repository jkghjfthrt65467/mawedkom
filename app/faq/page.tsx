"use client";

import { useT } from "@/components/LocaleProvider";
import { faqOf } from "@/lib/i18n";

export default function FaqPage() {
  const t = useT();
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <h1 className="text-3xl font-bold">{t("pages.faqTitle")}</h1>
      {faqOf(t.locale).map((f) => (
        <details key={f.q} className="nubo-card px-4 py-3" open>
          <summary className="cursor-pointer font-semibold">{f.q}</summary>
          <p className="mt-2 text-sm leading-7 text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
