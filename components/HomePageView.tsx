"use client";

import Link from "next/link";
import { PlansGrid } from "@/components/PlansGrid";
import { SearchBar } from "@/components/SearchBar";
import { SalonCard } from "@/components/SalonCard";
import { CategoryGrid } from "@/components/CategoryGrid";
import { Icon } from "@/components/ui/Icon";
import { useT } from "@/components/LocaleProvider";
import { CITIES } from "@/lib/data";
import { cityLabel, faqOf } from "@/lib/i18n";
import type { Business } from "@/lib/types";

export function HomePageView({ featured, categoryCount }: { featured: Business[]; categoryCount: number }) {
  const t = useT();
  const faq = faqOf(t.locale);
  return (
    <div className="space-y-12">
      <section className="nubo-bento nubo-bento-home">
        <div className="nubo-bento-hero nubo-glass p-5 md:p-8">
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1 text-xs font-semibold text-palm">
            <Icon name="spark" className="h-3.5 w-3.5" />
            {t("brand.kicker")}
          </p>
          <h1 className="text-4xl font-bold leading-[1.35] text-ink md:text-5xl">{t("home.h1")}</h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-muted">{t("home.lead")}</p>
          <div className="mt-6">
            <SearchBar />
          </div>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted">
            {CITIES.slice(0, 6).map((c) => (
              <Link key={c.slug} href={`/salons/${c.slug}`} className="nubo-chip text-xs">
                {cityLabel(t.locale, c.slug)}
              </Link>
            ))}
          </div>
        </div>
        <div className="nubo-bento-cta nubo-card-ink overflow-hidden p-6">
          <p className="text-sm text-gold">{t("home.forOwners")}</p>
          <h2 className="mt-2 text-2xl font-bold leading-9">{t("home.ownerH")}</h2>
          <ul className="mt-4 space-y-2 text-sm leading-7 text-ink/80">
            <li className="flex items-start gap-2">
              <Icon name="check" className="mt-1 h-4 w-4 text-gold" />
              {t("home.owner1")}
            </li>
            <li className="flex items-start gap-2">
              <Icon name="calendar" className="mt-1 h-4 w-4 text-gold" />
              {t("home.owner2")}
            </li>
            <li className="flex items-start gap-2">
              <Icon name="spark" className="mt-1 h-4 w-4 text-gold" />
              {t("home.owner3")}
            </li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/business" className="nubo-btn nubo-btn-gold">
              {t("nav.business")}
            </Link>
            <Link href="/business/signup" className="nubo-btn nubo-btn-ghost">
              {t("home.signup")}
            </Link>
          </div>
        </div>
      </section>

      <section className="nubo-bento-stats grid grid-cols-2 gap-3 md:grid-cols-4">
        {(
          [
            ["15+", t("home.statCities")],
            [`${categoryCount}`, t("home.statCats")],
            [t("home.statFree"), t("home.statStart")],
            ["0", t("home.statZero")],
          ] as const
        ).map(([n, l], i) => (
          <div key={l} className={`nubo-card px-4 py-5 text-center ${i === 2 ? "border-palm/40" : ""}`}>
            <p className="text-3xl font-bold text-palm">{n}</p>
            <p className="mt-1 text-sm text-muted">{l}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">{t("home.plansTitle")}</h2>
            <p className="mt-2 text-sm leading-7 text-muted">{t("home.plansLead")}</p>
          </div>
          <Link href="/pricing" className="shrink-0 text-sm font-semibold text-palm">
            {t("home.allDetails")}
          </Link>
        </div>
        <PlansGrid />
      </section>

      <section className="nubo-bento-cats">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl font-bold">{t("home.allFields")}</h2>
          <Link href="/salons" className="text-sm font-semibold text-palm">
            {t("footer.allBookings")}
          </Link>
        </div>
        <CategoryGrid />
      </section>

      <section>
        <h2 className="mb-5 text-2xl font-bold">{t("home.featured")}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((b) => (
            <SalonCard key={b.slug} b={b} />
          ))}
        </div>
      </section>

      <section id="how" className="nubo-card p-6 md:p-8">
        <h2 className="text-2xl font-bold">{t("home.how")}</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {(
            [
              ["search", t("home.how1t"), t("home.how1d")],
              ["calendar", t("home.how2t"), t("home.how2d")],
              ["check", t("home.how3t"), t("home.how3d")],
            ] as const
          ).map(([icon, title, d], i) => (
            <li key={title} className="rounded-2xl bg-sand/80 p-4">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gold-soft text-palm">
                <Icon name={icon} className="h-5 w-5" />
              </span>
              <p className="mt-3 text-xs font-semibold text-gold">{i + 1}</p>
              <p className="mt-1 font-bold">{title}</p>
              <p className="mt-2 text-sm leading-7 text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">{t("home.faqTitle")}</h2>
        <div className="space-y-2">
          {faq.slice(0, 4).map((f) => (
            <details key={f.q} className="nubo-card px-4 py-3">
              <summary className="cursor-pointer font-semibold">{f.q}</summary>
              <p className="mt-2 text-sm leading-7 text-muted">{f.a}</p>
            </details>
          ))}
        </div>
        <Link href="/faq" className="mt-3 inline-block text-sm font-semibold text-palm">
          {t("home.allFaq")}
        </Link>
      </section>
    </div>
  );
}
