"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatAppointmentWhen, formatServiceList, formatTime12 } from "@/lib/booking-message";
import { createManageToken, manageAppointmentUrl } from "@/lib/booking-token";
import { bookableStaff, firstFreeStaff, holidayInfo, openSlotsByStaffDate, workingSlots } from "@/lib/availability";
import { formatIqd, upcomingDates } from "@/lib/data";
import { addBooking, fetchBookingByToken, fetchBusinessBookings, getUser, upsertBooking } from "@/lib/store";
import { monthBookingCount, planBlocksNewBookings, planOf, quotaMessage, quotaReached } from "@/lib/plans";
import { effectivePrice, sortedServices } from "@/lib/services";
import { planSessionDates, sessionCountOf } from "@/lib/series";
import type { BookingRecord, Business } from "@/lib/types";
import { notifyBookingConfirmed } from "@/lib/whatsapp";
import { ServicePrice, ServiceTags } from "@/components/ServiceMarks";
import { staffProfileHref } from "@/lib/contact";
import { useT } from "@/components/LocaleProvider";
import { getLocale, messagesOf } from "@/lib/i18n";

export function BookingWizard({
  business,
  presetService,
  presetStaff,
  manageToken,
  onDone,
  bare = false,
}: {
  business: Business;
  presetService?: string;
  presetStaff?: string;
  manageToken?: string;
  onDone?: (rec: BookingRecord) => void;
  /** Direct booking link: services only, no site chrome or extra links. */
  bare?: boolean;
}) {
  const t = useT();
  const STEPS = [...messagesOf(t.locale).book.steps];
  const [step, setStep] = useState(0);
  const [serviceIds, setServiceIds] = useState<string[]>(() => (presetService ? [presetService] : []));
  const [staffId, setStaffId] = useState(presetStaff || "");
  const [date, setDate] = useState(upcomingDates()[0].iso);
  const [time, setTime] = useState("");
  const [waitSlot, setWaitSlot] = useState("");
  const [name, setName] = useState(() => getUser()?.name || "");
  const [phone, setPhone] = useState(() => getUser()?.phone || "");
  const [doneRec, setDoneRec] = useState<BookingRecord | null>(null);
  const [waitDone, setWaitDone] = useState(false);
  const [seriesCount, setSeriesCount] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [existing, setExisting] = useState<BookingRecord | null>(null);
  const [occupied, setOccupied] = useState<BookingRecord[]>([]);

  const isEdit = Boolean(manageToken);
  const quotaUsed = monthBookingCount(occupied, business.slug);
  const trialBlock = !isEdit ? planBlocksNewBookings(business) : "";
  const overQuota = !isEdit && !trialBlock && quotaReached(business, quotaUsed);
  const services = business.services.filter((s) => serviceIds.includes(s.id));
  const serviceNames = services.map((s) => s.name);
  const serviceLabel = formatServiceList(serviceNames);
  const durationMin = services.reduce((n, s) => n + s.durationMin, 0);
  const priceIqd = services.reduce((n, s) => n + effectivePrice(s), 0);
  const staff = business.staff.find((s) => s.id === staffId);
  const dates = useMemo(() => upcomingDates(14), []);
  const dayInfo = holidayInfo(business, date);
  const eligibleStaff = bookableStaff(business, serviceIds);
  const pausedStaff = business.staff.filter(
    (s) => s.bookingPaused && (serviceIds.length === 0 || serviceIds.some((id) => s.serviceIds.includes(id))),
  );
  const ignore = existing ? { ignoreBookingId: existing.id, ignoreToken: existing.manageToken } : undefined;
  const dateIsos = useMemo(() => dates.map((d) => d.iso), [dates]);
  const openByStaff = useMemo(
    () => openSlotsByStaffDate(business, durationMin, occupied, eligibleStaff, dateIsos, ignore),
    [business, durationMin, occupied, eligibleStaff, dateIsos, ignore?.ignoreBookingId, ignore?.ignoreToken],
  );
  const staffWithTime = eligibleStaff.filter((s) => dateIsos.some((iso) => (openByStaff[s.id]?.[iso] || []).length > 0));
  const selectedStaff = staffId && staffId !== "any" ? eligibleStaff.find((s) => s.id === staffId) : undefined;
  const openSlots =
    services.length > 0 && !dayInfo.closed
      ? selectedStaff
        ? openByStaff[selectedStaff.id]?.[date] || []
        : Array.from(new Set(staffWithTime.flatMap((s) => openByStaff[s.id]?.[date] || []))).sort()
      : [];
  const allSlots =
    services.length > 0 && !dayInfo.closed
      ? selectedStaff
        ? workingSlots(business, date, durationMin, selectedStaff)
        : Array.from(new Set(eligibleStaff.flatMap((s) => workingSlots(business, date, durationMin, s)))).sort()
      : [];
  const openSet = new Set(openSlots);

  function dayHasTime(iso: string) {
    if (selectedStaff) return (openByStaff[selectedStaff.id]?.[iso] || []).length > 0;
    return staffWithTime.some((s) => (openByStaff[s.id]?.[iso] || []).length > 0);
  }

  function toggleService(id: string) {
    setServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  useEffect(() => {
    void fetchBusinessBookings(business.slug).then(setOccupied);
  }, [business.slug]);

  useEffect(() => {
    if (time && !openSet.has(time)) setTime("");
  }, [date, staffId, serviceIds.join("|"), occupied]);

  useEffect(() => {
    setWaitSlot("");
  }, [date, staffId, serviceIds.join("|")]);

  useEffect(() => {
    if (staffId && staffId !== "any" && !staffWithTime.some((s) => s.id === staffId)) {
      setStaffId("");
    }
  }, [serviceIds.join("|"), occupied.length, durationMin]);

  useEffect(() => {
    if (!manageToken) return;
    void fetchBookingByToken(manageToken).then((rec) => {
      if (!rec || rec.businessSlug !== business.slug) return;
      setExisting(rec);
      const names = rec.serviceNames?.length ? rec.serviceNames : rec.serviceName ? rec.serviceName.split(" + ") : [];
      const matched = business.services.filter((s) => names.includes(s.name) || s.name === rec.serviceName).map((s) => s.id);
      if (matched.length) setServiceIds(matched);
      const matchedStaff = business.staff.find((s) => s.id === rec.staffId || s.name === rec.staffName);
      setStaffId(matchedStaff?.id || "any");
      if (rec.date) setDate(rec.date);
      if (rec.time) setTime(rec.time);
      if (rec.customerName) setName(rec.customerName);
      if (rec.customerPhone) setPhone(rec.customerPhone);
    });
  }, [manageToken, business]);

  async function next() {
    setError("");
    if (step === 0 && services.length === 0) return setError("اختار خدمة واحدة على الأقل.");
    if (step === 1 && eligibleStaff.length === 0) return setError("ماكو موظف يقدر يسوي كل الخدمات المختارة.");
    if (step === 1 && staffWithTime.length === 0) {
      return setError("ماكو موظف عنده فراغ متصل يكفي لكل الخدمات. قلّل الخدمات أو جرّب أيام ثانية.");
    }
    if (step === 1 && !staffId) return setError("اختار موظف أو أي شخص متاح.");
    if (step === 1 && staffId !== "any" && !staffWithTime.some((s) => s.id === staffId)) {
      return setError("هذا الموظف ما عنده وقت يكفي لكل الخدمات المختارة. اختار غيره.");
    }
    if (step === 2 && dayInfo.closed) return setError(dayInfo.reason || "هذا اليوم عطلة.");
    if (step === 2 && !time && !waitSlot) return setError("اختار ساعة متاحة، أو سجّل انتظار على ساعة محجوزة.");
    if (step === 2 && time && !openSet.has(time)) return setError("هذا الوقت محجوز. اختار ساعة ثانية أو سجّل انتظار.");
    if (step === 3) {
      if (name.trim().length < 2) return setError("اكتب اسمك الثلاثي أو الثنائي.");
      if (!/^07\d{9}$/.test(phone.replace(/\s/g, ""))) {
        return setError("رقم عراقي يبدأ بـ 07 ويتكوّن من 11 رقم.");
      }
      if (waitSlot && !isEdit) {
        setBusy(true);
        try {
          const res = await fetch("/api/waitlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              businessSlug: business.slug,
              date,
              time: waitSlot,
              customerName: name.trim(),
              customerPhone: phone.replace(/\s/g, ""),
              serviceId: services[0]?.id,
              serviceName: serviceLabel,
              staffId: selectedStaff?.id,
            }),
          });
          const data = (await res.json()) as { ok?: boolean; error?: string };
          if (!res.ok || !data.ok) {
            setError(data.error || "ما قدرنا نسجّلك بقائمة الانتظار.");
            return;
          }
          setWaitDone(true);
        } catch {
          setError("السيرفر ما رد.");
        } finally {
          setBusy(false);
        }
        return;
      }
      const assigned =
        staff && staffId !== "any"
          ? staff
          : firstFreeStaff(business, date, time, durationMin, occupied, staffWithTime, ignore);
      if (!assigned) return setError("ماكو موظف فاضي بهذي الساعة. اختار وقت ثاني.");
      const sessions = isEdit || services.length !== 1 ? 1 : sessionCountOf(services[0]?.sessionCount);
      const seriesId = sessions > 1 ? `sr-${Date.now().toString(36)}` : undefined;
      const rec: BookingRecord = {
        id: existing?.id || `nb-${Date.now()}`,
        manageToken: existing?.manageToken || manageToken || createManageToken(),
        businessSlug: business.slug,
        businessName: business.name,
        serviceName: serviceLabel,
        serviceNames,
        staffId: assigned.id,
        staffName: assigned.name,
        date,
        time,
        durationMin,
        priceIqd,
        customerName: name.trim(),
        customerPhone: phone.replace(/\s/g, ""),
        status: business.approvalMode === "MANUAL" ? "pending" : "confirmed",
        source: "public",
        createdAt: existing?.createdAt || new Date().toISOString(),
        seriesId,
        sessionIndex: sessions > 1 ? 1 : undefined,
        sessionTotal: sessions > 1 ? sessions : undefined,
        locale: getLocale(),
      };
      if (existing || manageToken) {
        upsertBooking(rec);
        setDoneRec(rec);
        onDone?.(rec);
        setStep((s) => Math.min(s + 1, 4));
        return;
      }
      setBusy(true);
      const ownerPhone = (business.ownerNotifyPhone || business.phone || "").trim();
      const synced = await addBooking(rec, { ownerNotifyPhone: ownerPhone });
      if (synced?.ok === false && synced.error) {
        setBusy(false);
        setError(synced.error);
        setStep(2);
        return;
      }
      notifyBookingConfirmed(rec, {
        ownerPhone,
        serverWhatsApp: synced?.whatsapp,
      });
      let made = 1;
      if (sessions > 1) {
        const follow = planSessionDates(date, sessions, services[0]?.intervalDays).slice(1);
        let extraOccupied = synced?.booking ? [synced.booking, ...occupied] : occupied;
        for (let i = 0; i < follow.length; i++) {
          const nextDate = follow[i];
          const nextStaff = firstFreeStaff(business, nextDate, time, durationMin, extraOccupied, eligibleStaff);
          if (!nextStaff) continue;
          const extra: BookingRecord = {
            ...rec,
            id: `nb-${Date.now()}-${i + 2}`,
            manageToken: createManageToken(),
            date: nextDate,
            staffId: nextStaff.id,
            staffName: nextStaff.name,
            sessionIndex: i + 2,
            createdAt: new Date().toISOString(),
          };
          const extraSync = await addBooking(extra, { ownerNotifyPhone: ownerPhone, silent: true });
          if (extraSync?.ok === false) continue;
          extraOccupied = extraSync?.booking ? [extraSync.booking, ...extraOccupied] : extraOccupied;
          made += 1;
        }
      }
      setBusy(false);
      setSeriesCount(made);
      setDoneRec(synced?.booking || rec);
      onDone?.(synced?.booking || rec);
    }
    setStep((s) => Math.min(s + 1, 4));
  }

  if (business.bookingIntakePaused && !isEdit) {
    return (
      <div className="nubo-card nubo-empty">
        <h2 className="text-2xl font-bold">الحجز متوقف مؤقتاً</h2>
        <p className="mt-3 text-sm leading-7 text-muted">مدير المشروع أوقف استقبال المواعيد. جرّب لاحقاً أو تواصل واتساب.</p>
        {business.whatsappLink && (
          <a href={business.whatsappLink} className="nubo-btn nubo-btn-primary mt-4" target="_blank" rel="noreferrer">
            واتساب المحل
          </a>
        )}
      </div>
    );
  }

  if (trialBlock) {
    return (
      <div className="nubo-card nubo-empty">
        <h2 className="text-2xl font-bold">التجربة المجانية انتهت</h2>
        <p className="mt-3 text-sm leading-7 text-muted">{trialBlock} تواصل ويا المحل أو جرّب لاحقاً.</p>
        {business.whatsappLink && (
          <a href={business.whatsappLink} className="nubo-btn nubo-btn-primary mt-4" target="_blank" rel="noreferrer">
            واتساب المحل
          </a>
        )}
      </div>
    );
  }

  if (overQuota) {
    return (
      <div className="nubo-card nubo-empty">
        <h2 className="text-2xl font-bold">الحجوزات بهالشهر اكتملت</h2>
        <p className="mt-3 text-sm leading-7 text-muted">{quotaMessage(planOf(business))} تواصل ويا المحل أو جرّب الشهر الجاي.</p>
        {business.whatsappLink && (
          <a href={business.whatsappLink} className="nubo-btn nubo-btn-primary mt-4" target="_blank" rel="noreferrer">
            واتساب المحل
          </a>
        )}
      </div>
    );
  }

  if (waitDone) {
    return (
      <div className="nubo-card p-6 text-center">
        <p className="text-sm text-gold">قائمة الانتظار</p>
        <h2 className="mt-2 text-2xl font-bold">انسجّلت. نبلّغك إذا الساعة فاضت</h2>
        <p className="mt-3 text-sm leading-7 text-muted">
          {serviceLabel} · {formatAppointmentWhen(date, waitSlot)}. إذا انلغى الموعد، يوصلك واتساب ورابط الحجز.
        </p>
      </div>
    );
  }

  if (doneRec) {
    const manageHref = `/m/${doneRec.manageToken}`;
    return (
      <div className="nubo-card p-6 text-center">
        <div className="nubo-confetti" aria-hidden>
          <i /><i /><i /><i /><i />
        </div>
        <div className="nubo-success-mark" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M5 12.5 9.5 17 19 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="mt-4 text-sm text-gold">{isEdit ? "تم تعديل الموعد" : doneRec.status === "pending" ? "طلب الحجز وصل" : "تم الحجز"}</p>
        <h2 className="mt-2 text-2xl font-bold">{isEdit ? "موعدك تحدّث" : doneRec.status === "pending" ? "بانتظار موافقة المدير" : "موعدك صار جاهز"}</h2>
        <p className="mt-3 text-sm leading-7 text-muted">
          {formatServiceList(doneRec.serviceNames?.length ? doneRec.serviceNames : [doneRec.serviceName])} مع {doneRec.staffName} · {formatAppointmentWhen(doneRec.date, doneRec.time)}.
          الدفع عند المحل: {formatIqd(doneRec.priceIqd)}.
          {seriesCount > 1 ? ` حجزنا ${seriesCount} جلسات بنفس الساعة.` : ""}
          {doneRec.status === "pending"
            ? " الموعد معلّق إلى أن يأكد مدير المشروع."
            : !isEdit && " إذا واتساب مربوط، التأكيد ينرسل لرقم الزبون."}
        </p>
        <p className="mt-2 font-mono text-xs text-muted">رقم الموعد {doneRec.id}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={manageHref} className="nubo-btn nubo-btn-primary">
            إدارة الموعد
          </Link>
          {!bare && (
            <>
              <Link href="/account/appointments" className="nubo-btn nubo-btn-ghost">
                مواعيدي
              </Link>
              <Link href={`/salon/${business.slug}`} className="nubo-btn nubo-btn-ghost">
                رجوع للصفحة
              </Link>
            </>
          )}
        </div>
        {!isEdit && (
          <p className="mt-4 break-all text-xs leading-6 text-muted" dir="ltr">
            {manageAppointmentUrl(doneRec.manageToken)}
          </p>
        )}
      </div>
    );
  }

  const visualSteps = 4;
  return (
    <div className="nubo-card p-5 md:p-6">
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-xs text-muted">
          <span className="font-semibold text-ink">{STEPS[Math.min(step, visualSteps - 1)]}</span>
          <span>
            {Math.min(step + 1, visualSteps)} / {visualSteps}
          </span>
        </div>
        <div className="nubo-progress" aria-hidden>
          <span style={{ width: `${((Math.min(step, visualSteps - 1) + 1) / visualSteps) * 100}%` }} />
        </div>
        {step > 0 && services.length > 0 && (
          <p className="mt-3 text-sm leading-6 text-muted">
            {serviceLabel} · {durationMin} دقيقة · {formatIqd(priceIqd)}
          </p>
        )}
      </div>

      {step === 0 && (
        <div className="grid gap-2">
          <p className="text-sm leading-7 text-muted">اختار خدمة أو أكثر لنفس الموعد. المدة والسعر ينجمعون.</p>
          {sortedServices(business.services).map((s) => {
            const on = serviceIds.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleService(s.id)}
                aria-pressed={on}
                className={`nubo-select-card flex items-center justify-between gap-3 px-4 py-3 ${on ? "nubo-select-card--on" : ""}`}
              >
                <span className="flex min-w-0 items-start gap-3">
                  <span
                    className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[11px] font-bold ${
                      on ? "border-palm bg-palm text-white" : "border-line text-transparent"
                    }`}
                    aria-hidden
                  >
                    ✓
                  </span>
                  <span>
                    <span className="block font-semibold">{s.name}</span>
                    <ServiceTags s={s} />
                    <span className="text-xs text-muted">
                      {s.durationMin} دقيقة
                      {sessionCountOf(s.sessionCount) > 1 ? ` · ${sessionCountOf(s.sessionCount)} جلسات` : ""}
                    </span>
                  </span>
                </span>
                <ServicePrice s={s} />
              </button>
            );
          })}
          {services.length > 0 && (
            <p className="rounded-2xl bg-sand px-4 py-3 text-sm leading-7 text-muted">
              اخترت {serviceLabel} · {durationMin} دقيقة · {formatIqd(priceIqd)} عند المحل.
            </p>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-2">
          <p className="text-sm leading-7 text-muted">
            نعرض اللي يقدر يسوي {serviceLabel} وعنده فراغ متصل {durationMin} دقيقة.
          </p>
          {business.showStaffPicker === false ? (
            <button
              type="button"
              onClick={() => setStaffId("any")}
              disabled={staffWithTime.length === 0}
              className={`nubo-select-card px-4 py-3 ${staffId === "any" ? "nubo-select-card--on" : ""} ${staffWithTime.length === 0 ? "opacity-50" : ""}`}
            >
              أي موظف متاح
            </button>
          ) : (
            <>
              {staffWithTime.length > 0 && (
                <button
                  type="button"
                  onClick={() => setStaffId("any")}
                  className={`nubo-select-card px-4 py-3 ${staffId === "any" ? "nubo-select-card--on" : ""}`}
                >
                  أي موظف متاح
                </button>
              )}
              {eligibleStaff.map((s) => {
                const hasTime = staffWithTime.some((x) => x.id === s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={!hasTime}
                    onClick={() => hasTime && setStaffId(s.id)}
                    className={`nubo-select-card flex items-center gap-3 px-4 py-3 ${staffId === s.id ? "nubo-select-card--on" : ""} ${hasTime ? "" : "opacity-50"}`}
                  >
                    {s.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.photo} alt="" className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-palm-soft text-sm font-bold text-palm">{s.initials}</span>
                    )}
                    <span className="min-w-0 text-right">
                      <span className="block font-semibold">{s.name}</span>
                      <span className={`text-xs ${hasTime ? "text-muted" : "text-terracotta"}`}>
                        {hasTime ? s.role : "ماكو فراغ يكفي لكل الخدمات بهالأيام"}
                      </span>
                      <Link href={staffProfileHref(business.slug, s.id)} className="mt-1 block text-xs font-semibold text-palm" onClick={(e) => e.stopPropagation()}>
                        بروفايل الموظف
                      </Link>
                    </span>
                  </button>
                );
              })}
              {pausedStaff.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-line px-4 py-3 opacity-50">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-sand text-sm font-bold">{s.initials}</span>
                  <span>
                    <span className="block font-semibold">{s.name}</span>
                    <span className="text-xs text-terracotta">الحجوزات متوقفة على هذا الموظف</span>
                  </span>
                </div>
              ))}
              {eligibleStaff.length === 0 && (
                <p className="rounded-2xl bg-sand p-4 text-sm text-muted">ماكو موظف يقدر يسوي كل الخدمات المختارة حالياً. المدير موقف الحجوزات أو ما ربطهن بأحد.</p>
              )}
              {eligibleStaff.length > 0 && staffWithTime.length === 0 && (
                <p className="rounded-2xl bg-sand p-4 text-sm text-muted">الموظفون يقدرون يسوين الخدمات، بس ماكو فراغ متصل يكفي المدة الكاملة. قلّل خدمة أو جرّب بعدين.</p>
              )}
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm leading-7 text-muted">
            الساعة لازم تكون فراغ متصل يكفي {serviceLabel} ({durationMin} دقيقة). الأحمر محجوز أو ما يكفي المدة.
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {dates.map((d) => {
              const closed = holidayInfo(business, d.iso).closed;
              const free = !closed && dayHasTime(d.iso);
              return (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => {
                    setDate(d.iso);
                    setTime("");
                    setWaitSlot("");
                  }}
                  className={`nubo-cal-day min-w-[5.2rem] min-h-16 ${
                    date === d.iso ? "nubo-cal-day--selected" : closed ? "nubo-cal-day--holiday" : free ? "nubo-cal-day--available" : "nubo-cal-day--booked"
                  }`}
                >
                  <span className="block font-bold">{d.label}</span>
                  <span className="text-xs opacity-80">{d.sub}</span>
                  {closed ? <span className="mt-1 block text-[10px]">عطلة</span> : !free ? <span className="mt-1 block text-[10px]">ممتلئ</span> : null}
                </button>
              );
            })}
          </div>
          {dayInfo.closed ? (
            <div className="rounded-2xl bg-sand p-4 text-sm leading-7 text-muted">
              <p className="font-bold text-ink">هذا اليوم عطلة</p>
              <p className="mt-1">{dayInfo.reason} اختار يوم ثاني من الشريط فوق.</p>
            </div>
          ) : allSlots.length === 0 ? (
            <p className="rounded-2xl bg-sand p-4 text-sm text-muted">ماكو ساعات بهاليوم تكفي مدة كل الخدمات. جرّب يوم ثاني أو قلّل خدمة.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {allSlots.map((t) => {
                const booked = !openSet.has(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      if (booked) {
                        if (isEdit) return;
                        setWaitSlot(t);
                        setTime("");
                        return;
                      }
                      setTime(t);
                      setWaitSlot("");
                    }}
                    className={`nubo-slot ${booked ? "nubo-slot--booked" : time === t ? "nubo-slot--selected" : ""} ${waitSlot === t ? "ring-2 ring-palm" : ""}`}
                  >
                    <span className="block">{formatTime12(t)}</span>
                    {booked && <span className="block text-[10px] font-semibold">{waitSlot === t ? "انتظار" : "محجوز"}</span>}
                  </button>
                );
              })}
            </div>
          )}
          {waitSlot && (
            <p className="rounded-2xl bg-sand p-3 text-sm leading-6 text-muted">
              الساعة {formatTime12(waitSlot, "long")} محجوزة. أكّد بياناتك حتى نبلّغك واتساب إذا انلغى الموعد.
            </p>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="grid gap-3">
          {waitSlot && (
            <p className="rounded-2xl bg-gold-soft px-3 py-2 text-sm text-palm">تسجيل انتظار على {formatAppointmentWhen(date, waitSlot)} — مو حجز نهائي.</p>
          )}
          <label className="grid gap-1 text-sm">
            الاسم
            <input
              className="rounded-2xl px-3 py-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: علي حسين"
            />
          </label>
          <label className="grid gap-1 text-sm">
            رقم الهاتف العراقي
            <input
              className="rounded-2xl px-3 py-3"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07xxxxxxxxx"
              inputMode="tel"
              dir="ltr"
            />
          </label>
          {!bare && (
            <p className="text-xs leading-6 text-muted">
              الحساب مو إجباري. إذا تحب تحفظ المواعيد بمكان واحد،{" "}
              <Link href="/register" className="text-palm underline">
                سجّل
              </Link>
              . الدفع عند الحضور، مو هسه.
            </p>
          )}
        </div>
      )}

      {error && <p className="mt-4 rounded-xl bg-terracotta/10 px-3 py-2 text-sm text-terracotta">{error}</p>}

      <div className="mt-6 flex justify-between gap-3">
        <button
          type="button"
          className="nubo-btn nubo-btn-ghost"
          disabled={step === 0 || busy}
          onClick={() => {
            setError("");
            setStep((s) => Math.max(0, s - 1));
          }}
        >
          رجوع
        </button>
        <button type="button" className="nubo-btn nubo-btn-primary" disabled={busy} onClick={() => void next()}>
          {step === 3 ? (waitSlot && !isEdit ? "سجّل انتظار" : isEdit ? "حفظ التعديل" : "أكّد الموعد") : "التالي"}
        </button>
      </div>
    </div>
  );
}
