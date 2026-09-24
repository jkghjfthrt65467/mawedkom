"use client";

import Link from "next/link";
import { FavoriteButton } from "@/components/FavoriteButton";
import { GoogleMapEmbed } from "@/components/maps/GoogleMapEmbed";
import { ServicePrice, ServiceTags } from "@/components/ServiceMarks";
import { Stars } from "@/components/Stars";
import { googleMapsDirectionsUrl, googleMapsViewUrl } from "@/lib/maps";
import { ContactIcons } from "@/components/ContactIcons";
import { businessAvatar, businessCover, staffProfileHref } from "@/lib/contact";
import { categoryBySlug, cityBySlug } from "@/lib/data";
import { ARABIC_WEEKDAYS, holidayInfo } from "@/lib/availability";
import { isManagedSlug, useLiveBusiness } from "@/lib/live-business";
import { formatHoursRange } from "@/lib/booking-message";
import { sortedServices } from "@/lib/services";
import { isManagerAuthed } from "@/lib/store";
import type { Business } from "@/lib/types";
import { useEffect, useState } from "react";

export function SalonProfileView({ initial }: { initial: Business }) {
  const b = useLiveBusiness(initial);
  const city = cityBySlug(b.city);
  const cat = categoryBySlug(b.category);
  const [manager, setManager] = useState(false);
  useEffect(() => setManager(isManagerAuthed()), []);
  const mapLink = b.lat && b.lng ? googleMapsViewUrl(b.lat, b.lng) : "";
  const directionsLink = b.lat && b.lng ? googleMapsDirectionsUrl(b.lat, b.lng) : "";
  const weeklyOff = (b.weeklyOffDays || []).map((d) => ARABIC_WEEKDAYS.find((x) => x.weekday === d)?.name).filter(Boolean);
  const nextHoliday = (b.holidayDates || []).find((iso) => holidayInfo(b, iso).closed);

  return (
    <div className="space-y-8">
      <header className="overflow-hidden rounded-3xl border border-line bg-surface">
        <div className={`relative h-44 overflow-hidden bg-gradient-to-br ${b.coverTone} md:h-56`}>
          {businessCover(b) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={businessCover(b)} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        </div>
        <div className="relative px-5 pb-6 md:px-8">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            {businessAvatar(b) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={businessAvatar(b)} alt="" className="h-24 w-24 rounded-full border-4 border-surface object-cover" />
            ) : (
              <span className="grid h-24 w-24 place-items-center rounded-full border-4 border-surface bg-palm-soft text-2xl font-bold text-palm">
                {b.name.slice(0, 1)}
              </span>
            )}
            <ContactIcons business={b} />
          </div>
          <p className="mt-4 text-xs text-gold">{cat?.name}</p>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl">{b.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <Stars value={b.rating} />
            <span>
              {b.rating} · {b.reviewCount} تقييم
            </span>
            <span>
              {b.district}، {city?.name}
            </span>
          </div>
          {b.bookingIntakePaused && (
            <p className="mt-3 inline-flex rounded-full bg-sand px-3 py-1 text-xs">الحجز متوقف مؤقتاً من المدير</p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={`/book/${b.slug}`} className="nubo-btn nubo-btn-gold">
              احجز موعد
            </Link>
            <FavoriteButton slug={b.slug} />
            {manager && isManagedSlug(b.slug) && (
              <Link href="/business/manage" className="nubo-btn nubo-btn-ghost">
                لوحة المدير
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <section className="nubo-card p-5">
            <h2 className="text-xl font-bold">الخدمات</h2>
            <ul className="mt-4 grid gap-2">
              {sortedServices(b.services).map((s) => (
                <li key={s.id} className="nubo-select-card flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <ServiceTags s={s} />
                    <p className="text-xs text-muted">{s.durationMin} دقيقة</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ServicePrice s={s} />
                    <Link href={`/book/${b.slug}?service=${s.id}`} className="nubo-btn nubo-btn-primary text-sm">
                      احجز
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="nubo-card p-5">
            <h2 className="text-xl font-bold">الفريق</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {b.staff.map((s) => (
                <Link key={s.id} href={staffProfileHref(b.slug, s.id)} className="nubo-select-card p-3 text-center">
                  {s.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.photo} alt={s.name} className="mx-auto h-20 w-20 rounded-full object-cover" />
                  ) : (
                    <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-palm-soft font-bold text-palm">{s.initials}</div>
                  )}
                  <p className="mt-2 font-semibold">{s.name}</p>
                  <p className="text-xs text-muted">{s.role}</p>
                  {s.bookingPaused && <p className="mt-1 text-xs text-terracotta">الحجوزات متوقفة</p>}
                  {s.bio && <p className="mt-2 line-clamp-3 text-xs leading-6 text-muted">{s.bio}</p>}
                </Link>
              ))}
            </div>
          </section>

          {(b.galleryPhotos || []).length > 0 && (
            <section className="nubo-card p-5">
              <h2 className="text-xl font-bold">المنشورات</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {b.galleryPhotos!.map((src) => (
                  <div key={src} className="overflow-hidden rounded-2xl border border-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-36 w-full object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="nubo-card p-5">
            <h2 className="text-xl font-bold">التقييمات</h2>
            <div className="mt-4 space-y-4">
              {b.reviews.map((r) => (
                <article key={r.id} className="nubo-select-card p-3">
                  <div className="flex items-center justify-between text-sm">
                    <p className="font-semibold">{r.author}</p>
                    <span className="text-muted">{r.date}</span>
                  </div>
                  <Stars value={r.rating} />
                  <p className="mt-2 text-sm leading-7">{r.text}</p>
                  {r.reply && (
                    <p className="mt-2 rounded-xl bg-palm-soft px-3 py-2 text-xs leading-6 text-palm-deep">رد المحل: {r.reply}</p>
                  )}
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="nubo-card p-5">
            <h2 className="font-bold">عن المحل</h2>
            <p className="mt-2 text-sm leading-7 text-muted">{b.about}</p>
          </section>
          <section className="nubo-card p-5">
            <h2 className="font-bold">العنوان والدوام</h2>
            <p className="mt-2 text-sm leading-7">{b.address}</p>
            {weeklyOff.length > 0 && <p className="mt-2 text-sm text-terracotta">عطل أسبوعية: {weeklyOff.join("، ")}</p>}
            {nextHoliday && <p className="mt-1 text-xs text-muted">أقرب إغلاق محدد: {nextHoliday}</p>}
            <ul className="mt-3 text-sm text-muted">
              {b.hours.map((h) => (
                <li key={h.days}>
                  {h.days}: {formatHoursRange(h.open, h.close)}
                </li>
              ))}
            </ul>
            <div className="mt-4 overflow-hidden rounded-2xl border border-line">
              {b.lat && b.lng ? (
                <>
                  <GoogleMapEmbed lat={b.lat} lng={b.lng} title={`خريطة ${b.name}`} className="h-52 w-full border-0" />
                  <div className="flex flex-wrap gap-2 border-t border-line bg-surface p-3">
                    <a href={mapLink} target="_blank" rel="noreferrer" className="nubo-btn nubo-btn-primary text-sm">
                      خرائط Google
                    </a>
                    <a href={directionsLink} target="_blank" rel="noreferrer" className="nubo-btn nubo-btn-ghost text-sm">
                      الاتجاهات
                    </a>
                  </div>
                </>
              ) : (
                <div className="grid h-40 place-items-center text-sm text-muted">
                  خريطة {city?.name} · {b.district}
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
