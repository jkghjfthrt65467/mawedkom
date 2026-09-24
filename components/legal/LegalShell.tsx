import Link from "next/link";
import type { ReactNode } from "react";
import type { LegalTocItem } from "@/lib/legal";
import { LEGAL_CONTACT_EMAIL, LEGAL_UPDATED_AR } from "@/lib/legal";

export function LegalShell({
  title,
  description,
  toc,
  children,
}: {
  title: string;
  description: string;
  toc: LegalTocItem[];
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl space-y-8 pb-16">
      <header className="space-y-3">
        <p className="text-sm text-gold">موعدكم · وثائق قانونية</p>
        <h1 className="text-3xl font-bold text-ink md:text-4xl">{title}</h1>
        <p className="text-sm leading-7 text-muted">{description}</p>
        <p className="text-sm text-muted">
          آخر تحديث: {LEGAL_UPDATED_AR}. للتواصل:{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="font-semibold text-palm" dir="ltr">
            {LEGAL_CONTACT_EMAIL}
          </a>
        </p>
        <nav className="flex flex-wrap gap-2 text-sm">
          <Link href="/terms" className="nubo-chip">
            الشروط
          </Link>
          <Link href="/privacy" className="nubo-chip">
            الخصوصية
          </Link>
          <Link href="/refund" className="nubo-chip">
            الاسترجاع
          </Link>
          <Link href="/contact" className="nubo-chip">
            الدعم
          </Link>
        </nav>
      </header>

      <nav aria-label="فهرس الصفحة" className="nubo-card space-y-3 p-5">
        <h2 className="text-base font-bold text-ink">محتويات الصفحة</h2>
        <ol className="grid gap-2 text-sm leading-7 text-muted sm:grid-cols-2">
          {toc.map((item, i) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="hover:text-palm">
                {i + 1}. {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="legal-body space-y-8 text-sm leading-8 text-muted [&_h2]:scroll-mt-24 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-ink [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pr-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pr-5 [&_a]:font-semibold [&_a]:text-palm">
        {children}
      </div>
    </article>
  );
}
