"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { showToast } from "@/lib/toast";

export function bookingPath(slug: string) {
  return `/book/${slug}`;
}

export function DirectBookingLink({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const [url, setUrl] = useState(bookingPath(slug));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}${bookingPath(slug)}`);
  }, [slug]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast("تم نسخ رابط الحجز المباشر");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      showToast("ما قدرنا ننسخ الرابط", "err");
    }
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        <button type="button" className="nubo-btn nubo-btn-gold text-sm" onClick={() => void copy()}>
          {copied ? "تم النسخ" : "نسخ رابط الحجز"}
        </button>
        <Link href={bookingPath(slug)} className="nubo-btn nubo-btn-ghost text-sm">
          فتح الحجز
        </Link>
      </div>
    );
  }

  return (
    <div className="nubo-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-bold">رابط الحجز المباشر</p>
        <p className="text-sm leading-7 text-muted">الزبون يشوف الخدمات فقط — بدون شعار موعدكم أو قوائم الموقع.</p>
        <p className="mt-1 break-all text-xs text-palm" dir="ltr">
          {url}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <button type="button" className="nubo-btn nubo-btn-primary text-sm" onClick={() => void copy()}>
          {copied ? "تم النسخ" : "نسخ الرابط"}
        </button>
        <Link href={bookingPath(slug)} className="nubo-btn nubo-btn-ghost text-sm">
          فتح الحجز
        </Link>
      </div>
    </div>
  );
}
