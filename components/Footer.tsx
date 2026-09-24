"use client";

import Link from "next/link";
import { useT } from "@/components/LocaleProvider";
import { categoryLabel, cityLabel } from "@/lib/i18n";
import { Logo } from "./Logo";
import { CATEGORIES, CITIES } from "@/lib/data";

export function Footer() {
  const t = useT();
  return (
    <footer className="mt-16 border-t border-line bg-canvas text-ink">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-4">
        <div className="space-y-3">
          <Logo light />
          <p className="text-sm leading-7 text-muted">{t("footer.about")}</p>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-bold text-gold">{t("footer.discover")}</h2>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <Link href="/salons">{t("footer.allBookings")}</Link>
            </li>
            {CATEGORIES.slice(0, 8).map((c) => (
              <li key={c.slug}>
                <Link href={`/c/${c.slug}`}>{categoryLabel(t.locale, c.slug)}</Link>
              </li>
            ))}
            <li>
              <Link href="/blog">{t("nav.blog")}</Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-bold text-gold">{t("footer.cities")}</h2>
          <ul className="grid grid-cols-2 gap-2 text-sm text-muted">
            {CITIES.slice(0, 10).map((c) => (
              <li key={c.slug}>
                <Link href={`/salons/${c.slug}`}>{cityLabel(t.locale, c.slug)}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-8">
          <div>
            <h2 className="mb-3 text-sm font-bold text-gold">{t("footer.legal")}</h2>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link href="/terms">{t("footer.terms")}</Link>
              </li>
              <li>
                <Link href="/privacy">{t("footer.privacy")}</Link>
              </li>
              <li>
                <Link href="/refund">{t("footer.refund")}</Link>
              </li>
              <li>
                <Link href="/faq">{t("footer.faq")}</Link>
              </li>
              <li>
                <Link href="/contact">{t("footer.contact")}</Link>
              </li>
              <li>
                <Link href="/about">{t("footer.who")}</Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-bold text-gold">{t("footer.owners")}</h2>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link href="/business">{t("nav.business")}</Link>
              </li>
              <li>
                <Link href="/business/signup">{t("home.signup")}</Link>
              </li>
              <li>
                <Link href="/business/manage">{t("nav.manage")}</Link>
              </li>
              <li>
                <Link href="/whatsapp">{t("nav.whatsapp")}</Link>
              </li>
              <li>
                <Link href="/admin">{t("nav.admin")}</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <p className="border-t border-line py-4 text-center text-xs text-muted">{t("footer.copy")}</p>
    </footer>
  );
}
