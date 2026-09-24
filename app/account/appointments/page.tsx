"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatAppointmentWhen, formatServiceList, bookingServiceNames, statusLabelAr } from "@/lib/booking-message";
import { getBookings, updateBooking } from "@/lib/store";
import type { BookingRecord } from "@/lib/types";
import { formatIqd } from "@/lib/data";
import { notifyBookingCancelled } from "@/lib/whatsapp";

export default function AppointmentsPage() {
  const [list, setList] = useState<BookingRecord[]>([]);
  useEffect(() => {
    setList(getBookings());
  }, []);

  function refresh() {
    setList(getBookings());
  }

  if (list.length === 0) {
    return (
      <div className="nubo-card nubo-empty">
        <p className="font-bold">ما عندك مواعيد بعد</p>
        <Link href="/salons" className="nubo-btn nubo-btn-primary mt-4">
          دور على محل
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">مواعيدي</h1>
      {list.map((b) => (
        <article key={b.id} className="nubo-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-bold">
                <Link href={`/salon/${b.businessSlug}`}>{b.businessName}</Link>
              </p>
              <p className="text-sm text-muted">
                {formatServiceList(bookingServiceNames(b))} · {b.staffName} · {formatAppointmentWhen(b.date, b.time)} · {b.durationMin} د
              </p>
              <p className="mt-1 text-sm">{formatIqd(b.priceIqd)} عند الحضور</p>
            </div>
            <span className="nubo-chip text-xs">{statusLabelAr(b.status)}</span>
          </div>
          {b.status === "confirmed" && (
            <div className="mt-3 flex flex-wrap gap-2">
              {b.manageToken && (
                <Link href={`/m/${b.manageToken}`} className="nubo-btn nubo-btn-ghost text-sm">
                  إدارة الموعد
                </Link>
              )}
              <Link href={`/book/${b.businessSlug}?manage=${b.manageToken || ""}`} className="nubo-btn nubo-btn-ghost text-sm">
                إعادة جدولة
              </Link>
              <button
                type="button"
                className="nubo-btn text-sm text-terracotta"
                onClick={() => {
                  updateBooking(b.id, { status: "cancelled" });
                  void notifyBookingCancelled({ ...b, status: "cancelled" });
                  refresh();
                }}
              >
                إلغاء
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
