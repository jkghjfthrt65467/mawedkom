"use client";

import Link from "next/link";
import { businessAvatar, businessCover } from "@/lib/contact";
import { categoryBySlug, cityBySlug } from "@/lib/data";
import { useLiveBusiness } from "@/lib/live-business";
import type { Business } from "@/lib/types";
import { useT } from "@/components/LocaleProvider";
import { categoryLabel, cityLabel } from "@/lib/i18n";
import { Icon } from "@/components/ui/Icon";
import { Stars } from "./Stars";

export function SalonCard({ b }: { b: Business }) {
  const t = useT();
  const live = useLiveBusiness(b);
  const city = cityBySlug(live.city);
  const cat = categoryBySlug(live.category);
  const profileHref = `/salon/${live.slug}`;
  const bookHref = `/book/${live.slug}`;
  return (
    <article className="nubo-card nubo-select-card overflow-hidden">
      <Link href={profileHref} className={`relative block h-32 overflow-hidden bg-gradient-to-br ${live.coverTone} p-4 text-ivory`} aria-label={`بروفايل ${live.name}`}>
        {businessCover(live) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={businessCover(live)} alt={live.name} className="absolute inset-0 h-full w-full object-cover opacity-70" />
        )}
        <div className="relative flex h-full flex-col justify-between">
          <p className="inline-flex w-fit rounded-full bg-black/25 px-2 py-0.5 text-[11px] backdrop-blur-sm">{cat ? categoryLabel(t.locale, cat.slug) : ""}</p>
          {businessAvatar(live) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={businessAvatar(live)} alt="" className="h-12 w-12 rounded-full border-2 border-white/80 object-cover" />
          ) : (
            <p className="text-3xl font-bold">{live.name.slice(0, 1)}</p>
          )}
        </div>
      </Link>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold leading-6">
            <Link href={profileHref} className="hover:text-palm">
              {live.name}
            </Link>
          </h3>
          <span className="shrink-0 text-xs text-muted">
            <Stars value={live.rating} />
            <span className="ms-1">{live.rating}</span>
          </span>
        </div>
        <p className="flex items-center gap-1 text-sm text-muted">
          <Icon name="map" className="h-3.5 w-3.5" />
          {live.district}، {city ? cityLabel(t.locale, city.slug) : live.city} · {live.reviewCount}
        </p>
        <p className="line-clamp-2 text-sm leading-6 text-ink/80">{live.about}</p>
        <div className="flex items-center justify-between pt-1">
          <Link href={profileHref} className="text-sm font-semibold text-palm">
            {t("owner.publicPage")}
          </Link>
          <Link href={bookHref} className="nubo-btn nubo-btn-primary text-sm">
            {t("nav.book")}
          </Link>
        </div>
      </div>
    </article>
  );
}
