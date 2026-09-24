"use client";

import { BookingWizard } from "@/components/BookingWizard";
import { bookingServiceNames, formatAppointmentWhen, formatServiceList, statusLabelAr } from "@/lib/booking-message";
import { businessBySlug } from "@/lib/data";
import { resolveBusiness } from "@/lib/live-business";
import { fetchBookingByToken, updateBookingByToken, upsertBooking } from "@/lib/store";
import type { BookingRecord, Business } from "@/lib/types";
import { notifyBookingCancelled } from "@/lib/whatsapp";
import { useCallback, useEffect, useState } from "react";

export function ManageAppointment({ token, initial }: { token: string; initial: BookingRecord | null }) {
  const [booking, setBooking] = useState<BookingRecord | null>(initial);
  const [loading, setLoading] = useState(!initial);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [liveBiz, setLiveBiz] = useState<Business | null>(null);

  const load = useCallback(async () => {
    const rec = await fetchBookingByToken(token);
    setBooking(rec);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (initial) {
      upsertBooking(initial);
      return;
    }
    void load();
  }, [initial, load]);

  useEffect(() => {
    const slug = booking?.businessSlug;
    if (!slug) return;
    void fetch(`/api/business?slug=${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { business?: Business }) => {
        if (data.business) setLiveBiz(data.business);
      })
      .catch(() => {});
  }, [booking?.businessSlug]);

  async function cancelAppointment() {
    if (!booking || busy) return;
    setBusy(true);
    const next =
      updateBookingByToken(token, { status: "cancelled" }) ||
      upsertBooking({ ...booking, status: "cancelled" });
    try {
      await fetch(`/api/bookings/${encodeURIComponent(token)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
    } catch {
      /* local cancel still applied */
    }
    setBooking(next);
    void notifyBookingCancelled(next);
    setBusy(false);
  }

  if (loading) {
    return <p className="text-muted">نجيب تفاصيل موعدك…</p>;
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-lg nubo-card nubo-empty">
        <h1 className="text-2xl font-bold">ما لقينا هالموعد</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          الرابط ناقص أو الموعد انمسح. تأكد من الرابط اللي وصلك على واتساب.
        </p>
      </div>
    );
  }

  const raw = liveBiz || businessBySlug(booking.businessSlug);
  const business = raw ? resolveBusiness(raw) : undefined;
  const canAct = booking.status === "confirmed" || booking.status === "pending";

  if (editing && business) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <button type="button" className="text-sm text-palm" onClick={() => setEditing(false)}>
          رجوع لتفاصيل الموعد
        </button>
        <h1 className="text-3xl font-bold">تعديل الموعد</h1>
        <BookingWizard
          business={business}
          manageToken={token}
          onDone={(rec) => {
            setBooking(rec);
            setEditing(false);
          }}
        />
      </div>
    );
  }

  const services = formatServiceList(bookingServiceNames(booking));
  const when = formatAppointmentWhen(booking.date, booking.time);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <p className="text-sm text-gold">إدارة الموعد</p>
      <h1 className="text-3xl font-bold">موعدك</h1>
      <article className="nubo-card space-y-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm text-muted">صاحب الموعد</p>
            <p className="font-bold">{booking.customerName}</p>
          </div>
          <span className="nubo-chip text-xs">{statusLabelAr(booking.status)}</span>
        </div>
        <div>
          <p className="text-sm text-muted">الخدمات</p>
          <p className="font-semibold">{services}</p>
        </div>
        <div>
          <p className="text-sm text-muted">المكان</p>
          <p className="font-semibold">{booking.businessName}</p>
        </div>
        <div>
          <p className="text-sm text-muted">التاريخ والوقت</p>
          <p className="font-semibold">{when}</p>
        </div>
        {booking.staffName && (
          <div>
            <p className="text-sm text-muted">الموظف</p>
            <p>{booking.staffName}</p>
          </div>
        )}
      </article>

      {canAct ? (
        <div className="flex flex-wrap gap-3">
          {business && (
            <button type="button" className="nubo-btn nubo-btn-primary" onClick={() => setEditing(true)}>
              تعديل الموعد
            </button>
          )}
          <button
            type="button"
            className="nubo-btn nubo-btn-ghost text-terracotta"
            disabled={busy}
            onClick={() => void cancelAppointment()}
          >
            إلغاء الموعد
          </button>
        </div>
      ) : (
        <p className="rounded-2xl bg-sand px-4 py-3 text-sm text-muted">
          {booking.status === "cancelled" ? "هذا الموعد ملغى. تكدر تحجز موعد جديد من صفحة المحل." : "هذا الموعد مكتمل."}
        </p>
      )}
    </div>
  );
}
