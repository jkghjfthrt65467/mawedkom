"use client";

import Link from "next/link";
import { useState } from "react";
import { ContactIcons } from "@/components/ContactIcons";
import { ServicePrice, ServiceTags } from "@/components/ServiceMarks";
import { Stars } from "@/components/Stars";
import { initialsFromName } from "@/lib/availability";
import { useLiveBusiness } from "@/lib/live-business";
import { sortedServices } from "@/lib/services";
import type { Business, Review } from "@/lib/types";

export function StaffProfileView({ initial, staffId }: { initial: Business; staffId: string }) {
  const b = useLiveBusiness(initial);
  const staff = b.staff.find((s) => s.id === staffId);
  const [reviews, setReviews] = useState<Review[]>(() => staff?.reviews || []);
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!staff) {
    return (
      <div className="nubo-card nubo-empty">
        <h1 className="text-2xl font-bold">ما لقينا هذا الموظف</h1>
        <Link href={`/salon/${b.slug}`} className="nubo-btn nubo-btn-primary mt-4">
          رجوع للمشروع
        </Link>
      </div>
    );
  }

  const services = sortedServices(b.services).filter((s) => staff.serviceIds.includes(s.id));
  const photos = staff.galleryPhotos || [];
  const shownReviews = reviews.length ? reviews : staff.reviews || [];

  async function sendReview() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/staff/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: b.slug, staffId, author, rating, text }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; reviews?: Review[] };
      if (!res.ok || !data.ok) {
        setError(data.error || "ما انحفظ التعليق.");
        return;
      }
      setReviews(data.reviews || []);
      setAuthor("");
      setText("");
      setRating(5);
    } catch {
      setError("السيرفر ما رد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="nubo-card overflow-hidden p-0">
        <div className={`relative h-36 bg-gradient-to-br ${b.coverTone}`}>
          {(b.coverPhoto || b.photo) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.coverPhoto || b.photo} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
          )}
        </div>
        <div className="relative px-5 pb-5">
          <div className="-mt-12 flex items-end justify-between gap-3">
            {staff.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={staff.photo} alt="" className="h-24 w-24 rounded-full border-4 border-canvas object-cover" />
            ) : (
              <span className="grid h-24 w-24 place-items-center rounded-full border-4 border-canvas bg-palm-soft text-xl font-bold text-palm">
                {staff.initials || initialsFromName(staff.name)}
              </span>
            )}
            <ContactIcons business={b} compact />
          </div>
          <p className="mt-3 text-xs text-gold">{b.name}</p>
          <h1 className="mt-1 text-3xl font-bold">{staff.name}</h1>
          <p className="text-sm text-muted">{staff.role}</p>
          {staff.bookingPaused && <p className="mt-2 text-sm text-terracotta">الحجوزات متوقفة على هذا الموظف حالياً.</p>}
          {staff.bio && <p className="mt-3 text-sm leading-7 text-muted">{staff.bio}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/book/${b.slug}?staff=${staff.id}`} className="nubo-btn nubo-btn-primary">
              احجز وياه
            </Link>
            <Link href={`/salon/${b.slug}`} className="nubo-btn nubo-btn-ghost">
              صفحة المشروع
            </Link>
          </div>
        </div>
      </header>

      <section className="nubo-card p-5">
        <h2 className="text-xl font-bold">خدماته</h2>
        <ul className="mt-4 grid gap-2">
          {services.map((s) => (
            <li key={s.id} className="nubo-select-card flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-semibold">{s.name}</p>
                <ServiceTags s={s} />
                <p className="text-xs text-muted">{s.durationMin} دقيقة</p>
              </div>
              <div className="flex items-center gap-3">
                <ServicePrice s={s} />
                <Link href={`/book/${b.slug}?service=${s.id}&staff=${staff.id}`} className="nubo-btn nubo-btn-primary text-sm">
                  احجز
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {photos.length > 0 && (
        <section className="nubo-card p-5">
          <h2 className="text-xl font-bold">صوره</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((src) => (
              <div key={src} className="overflow-hidden rounded-2xl border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-36 w-full object-cover" />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="nubo-card p-5">
        <h2 className="text-xl font-bold">التعليقات</h2>
        <div className="mt-4 space-y-3">
          {shownReviews.length === 0 && <p className="text-sm text-muted">ماكو تعليقات بعد. اكتب أول تعليق.</p>}
          {shownReviews.map((r) => (
            <article key={r.id} className="nubo-select-card p-3">
              <div className="flex items-center justify-between text-sm">
                <p className="font-semibold">{r.author}</p>
                <span className="text-muted">{r.date}</span>
              </div>
              <Stars value={r.rating} />
              <p className="mt-2 text-sm leading-7">{r.text}</p>
            </article>
          ))}
        </div>
        <form
          className="mt-5 grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void sendReview();
          }}
        >
          <p className="text-sm font-medium">أضف تعليق</p>
          <input className="rounded-2xl border border-line px-3 py-3" placeholder="اسمك" value={author} onChange={(e) => setAuthor(e.target.value)} required />
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" className={`nubo-chip ${rating === n ? "nubo-chip-on" : ""}`} onClick={() => setRating(n)}>
                {n}
              </button>
            ))}
          </div>
          <textarea className="min-h-24 rounded-2xl border border-line px-3 py-3" placeholder="شغله، الموعد، التعامل…" value={text} onChange={(e) => setText(e.target.value)} required />
          {error && <p className="text-sm text-terracotta">{error}</p>}
          <button className="nubo-btn nubo-btn-primary justify-self-start" disabled={busy}>
            انشر التعليق
          </button>
        </form>
      </section>
    </div>
  );
}

