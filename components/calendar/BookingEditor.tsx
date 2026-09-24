"use client";

import { useMemo, useState } from "react";
import { bookableStaff, firstFreeStaff, holidayInfo, padHm, slotsForBusiness, validateBookingSlot } from "@/lib/availability";
import { createManageToken } from "@/lib/booking-token";
import { isoInBaghdad } from "@/lib/calendar";
import { formatTime12 } from "@/lib/booking-message";
import { effectivePrice, isOnOffer, sortedServices } from "@/lib/services";
import { addBooking, upsertBooking } from "@/lib/store";
import { showToast } from "@/lib/toast";
import type { BookingRecord, BookingSource, Business, Staff } from "@/lib/types";
import type { BookingActor } from "@/lib/staff-permissions";
import { notifyBookingConfirmed } from "@/lib/whatsapp";

export function BookingEditor({
  business,
  bookings,
  role,
  lockedStaffId,
  actor,
  preset,
  existing,
  onClose,
  onSaved,
}: {
  business: Business;
  bookings: BookingRecord[];
  role: "owner" | "staff";
  lockedStaffId?: string;
  actor?: BookingActor;
  preset?: { date: string; time: string; staffId?: string };
  existing?: BookingRecord | null;
  onClose: () => void;
  onSaved: (rec: BookingRecord) => void;
}) {
  const defaultStaff = lockedStaffId || preset?.staffId || existing?.staffId || business.staff.find((s) => !s.bookingPaused)?.id || "";
  const [staffId, setStaffId] = useState(defaultStaff);
  const [serviceIds, setServiceIds] = useState<string[]>(() => {
    if (existing) {
      const names = existing.serviceNames?.length ? existing.serviceNames : [existing.serviceName];
      const ids = business.services.filter((s) => names.includes(s.name)).map((s) => s.id);
      return ids.length ? ids : business.services[0] ? [business.services[0].id] : [];
    }
    return business.services[0] ? [business.services[0].id] : [];
  });
  const [date, setDate] = useState(existing?.date || preset?.date || isoInBaghdad());
  const [time, setTime] = useState(existing?.time || preset?.time || "10:00");
  const [name, setName] = useState(existing?.customerName || "");
  const [phone, setPhone] = useState(existing?.customerPhone || "");
  const [source, setSource] = useState<BookingSource>(existing?.source || (role === "staff" ? "staff" : "walkin"));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const staff = business.staff.find((s) => s.id === staffId);
  const services = business.services.filter((s) => serviceIds.includes(s.id));
  const durationMin = services.reduce((n, s) => n + s.durationMin, 0) || existing?.durationMin || 30;
  const priceIqd = services.reduce((n, s) => n + effectivePrice(s), 0);
  const ignore = existing ? { ignoreBookingId: existing.id, ignoreToken: existing.manageToken } : undefined;
  const eligible = useMemo(() => bookableStaff(business, serviceIds), [business, serviceIds]);

  const slots = staff ? slotsForBusiness(business, date, durationMin, bookings, staff, ignore) : [];
  const dayClosed = holidayInfo(business, date);

  function toggleService(id: string) {
    setServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function save() {
    setError("");
    if (!staff) return setError("اختار موظفاً.");
    if (services.length === 0) return setError("اختار خدمة واحدة على الأقل.");
    if (dayClosed.closed) return setError(dayClosed.reason);
    if (name.trim().length < 2) return setError("اكتب اسم الزبون.");
    const phoneDigits = phone.replace(/\s/g, "");
    if (phoneDigits && !/^07\d{9}$/.test(phoneDigits)) return setError("إذا حطيت رقم، لازم يكون عراقي: 07 و11 مرتبة.");
    const check = validateBookingSlot(
      business,
      { date, time, durationMin, staffId: staff.id, staffName: staff.name, ...ignore },
      bookings,
    );
    if (!check.ok) return setError(check.reason);

    const rec: BookingRecord = {
      id: existing?.id || `nb-${Date.now()}`,
      manageToken: existing?.manageToken || createManageToken(),
      businessSlug: business.slug,
      businessName: business.name,
      serviceName: services.map((s) => s.name).join(" + "),
      serviceNames: services.map((s) => s.name),
      staffId: staff.id,
      staffName: staff.name,
      date,
      time,
      durationMin,
      priceIqd,
      customerName: name.trim(),
      customerPhone: phoneDigits,
      status: existing?.status && existing.status !== "cancelled" ? existing.status : "confirmed",
      source: existing?.source || source,
      createdAt: existing?.createdAt || new Date().toISOString(),
      locale: existing?.locale || business.locale || "ar",
    };

    setBusy(true);
    try {
      if (existing) {
        upsertBooking(rec, actor);
        const res = await fetch(`/api/bookings/${encodeURIComponent(rec.manageToken)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: rec.date,
            time: rec.time,
            durationMin: rec.durationMin,
            staffId: rec.staffId,
            staffName: rec.staffName,
            serviceName: rec.serviceName,
            serviceNames: rec.serviceNames,
            customerName: rec.customerName,
            customerPhone: rec.customerPhone,
            priceIqd: rec.priceIqd,
            actor,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; booking?: BookingRecord };
        if (!res.ok || data.ok === false) {
          setError(data.error || "ما قدرنا نحفظ التعديل.");
          setBusy(false);
          return;
        }
        onSaved(data.booking || rec);
        showToast("تم تعديل الموعد");
      } else {
        const ownerPhone = (business.ownerNotifyPhone || business.phone || "").trim();
        const synced = await addBooking(rec, { ownerNotifyPhone: ownerPhone, actor });
        if (synced?.ok === false && synced.error) {
          setError(synced.error);
          setBusy(false);
          return;
        }
        void notifyBookingConfirmed(synced?.booking || rec, {
          ownerPhone,
          serverWhatsApp: synced?.whatsapp,
        });
        onSaved(synced?.booking || rec);
      }
      onClose();
    } catch {
      setError("صار خلل بالاتصال. جرّب مرة ثانية.");
    }
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/55 p-3 sm:place-items-center" role="dialog" aria-modal>
      <form
        className="nubo-glass max-h-[92vh] w-full max-w-lg overflow-y-auto p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-gold">{existing ? "تعديل الموعد" : "موعد جديد من التقويم"}</p>
            <h2 className="text-xl font-bold">{existing ? "إعادة جدولة / تعديل" : "حجز حضور أو هاتف"}</h2>
          </div>
          <button type="button" className="text-muted" onClick={onClose} aria-label="إغلاق">
            ×
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm">
            الموظف
            <select
              className="rounded-2xl border border-line px-3 py-3"
              value={staffId}
              disabled={Boolean(lockedStaffId)}
              onChange={(e) => setStaffId(e.target.value)}
            >
              {(lockedStaffId ? business.staff.filter((s) => s.id === lockedStaffId) : eligible.length ? eligible : business.staff).map((s) => (
                <option key={s.id} value={s.id} disabled={s.bookingPaused}>
                  {s.name}
                  {s.bookingPaused ? " — متوقف" : ""}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">الخدمات</legend>
            <div className="flex flex-wrap gap-2">
              {sortedServices(business.services).map((s) => (
                <label key={s.id} className={`nubo-chip text-xs ${serviceIds.includes(s.id) ? "nubo-chip-on" : ""}`}>
                  <input type="checkbox" checked={serviceIds.includes(s.id)} onChange={() => toggleService(s.id)} />
                  {s.name}
                  {s.popular ? " · الأكثر" : ""}
                  {isOnOffer(s) ? " · عرض" : ""} · {s.durationMin} د
                </label>
              ))}
            </div>
            <p className="text-xs text-muted">المدة الكلية {durationMin} دقيقة (تُحجب على تقويم الموظف).</p>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              التاريخ
              <input className="rounded-2xl border border-line px-3 py-3" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              الساعة
              <select className="rounded-2xl border border-line px-3 py-3" value={time} onChange={(e) => setTime(e.target.value)}>
                {slots.includes(time) || !time ? null : <option value={time}>{formatTime12(time)} (الحالي)</option>}
                {slots.map((t) => (
                  <option key={t} value={t}>
                    {formatTime12(t)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {dayClosed.closed && <p className="rounded-xl bg-sand px-3 py-2 text-sm text-terracotta">{dayClosed.reason}</p>}
          {!dayClosed.closed && slots.length === 0 && (
            <p className="rounded-xl bg-sand px-3 py-2 text-sm text-muted">ماكو فراغ بهاليوم لهذا الموظف والمدة.</p>
          )}

          <label className="grid gap-1 text-sm">
            اسم الزبون
            <input className="rounded-2xl border border-line px-3 py-3" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="grid gap-1 text-sm">
            رقم الهاتف <span className="font-normal text-muted">(اختياري)</span>
            <input
              className="rounded-2xl border border-line px-3 py-3"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07xxxxxxxxx"
              inputMode="tel"
            />
          </label>

          {!existing && (
            <fieldset className="grid gap-2 text-sm">
              <legend className="font-medium">مصدر الحجز</legend>
              {(["walkin", "phone", "staff"] as const).map((s) => (
                <label key={s} className="flex items-center gap-2">
                  <input type="radio" name="source" checked={source === s} onChange={() => setSource(s)} />
                  {s === "walkin" ? "حضور للمحل" : s === "phone" ? "اتصال هاتفي" : "من الموظف"}
                </label>
              ))}
            </fieldset>
          )}
        </div>

        {error && <p className="mt-3 rounded-xl bg-terracotta/10 px-3 py-2 text-sm text-terracotta">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="nubo-btn nubo-btn-ghost" onClick={onClose}>
            إلغاء
          </button>
          <button className="nubo-btn nubo-btn-primary" disabled={busy}>
            {busy ? "نحفظ…" : existing ? "حفظ التعديل" : "تثبيت الموعد"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function suggestStaffForSlot(
  business: Business,
  bookings: BookingRecord[],
  date: string,
  time: string,
  preferred?: string,
): Staff | undefined {
  const duration = business.services[0]?.durationMin || 30;
  const preferredStaff = preferred ? business.staff.find((s) => s.id === preferred) : undefined;
  if (preferredStaff) {
    const ok = validateBookingSlot(business, { date, time, durationMin: duration, staffId: preferredStaff.id, staffName: preferredStaff.name }, bookings);
    if (ok.ok) return preferredStaff;
  }
  return firstFreeStaff(business, date, time, duration, bookings, bookableStaff(business));
}

export function snapMinutes(clientY: number, top: number, gridStart: number, pxPerMin: number): string {
  const mins = gridStart + Math.round((clientY - top) / pxPerMin / 30) * 30;
  return padHm(Math.max(gridStart, mins));
}
