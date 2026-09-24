"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { bookingRange, gridHours, holidayInfo, padHm, timeToMinutes } from "@/lib/availability";
import { formatAppointmentWhen, formatTime12, sourceLabelAr, statusLabelAr } from "@/lib/booking-message";
import {
  addDaysIso,
  clockInBaghdad,
  dayLabelAr,
  hexToRgba,
  isoInBaghdad,
  monthGrid,
  monthLabelAr,
  staffColor,
  visibleOnCalendar,
  weekDates,
  weekdayNameAr,
} from "@/lib/calendar";
import { subscribeBookingsChanged } from "@/lib/booking-live";
import { fetchBusinessBookings, upsertBooking, calendarActor } from "@/lib/store";
import { showToast } from "@/lib/toast";
import type { BookingRecord, Business } from "@/lib/types";
import { notifyBookingCancelled } from "@/lib/whatsapp";
import {
  canEditOtherStaffAppointments,
  canEditOwnAppointments,
  isOwnStaffBooking,
  staffScheduleDeniedReason,
} from "@/lib/staff-permissions";
import { BookingEditor, snapMinutes } from "./BookingEditor";
import { useT } from "@/components/LocaleProvider";

const PX_PER_MIN = 1.35;
const LIVE_POLL_MS = 5000;

function incomingBooking(rec: BookingRecord) {
  return rec.source !== "walkin" && rec.source !== "phone" && rec.source !== "staff";
}

function pingDesktop(title: string, body: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, tag: "mawedkom-booking" });
  } catch {
    /* ignore denied / unsupported */
  }
}

type View = "week" | "day" | "month";

function serviceLabel(b: BookingRecord) {
  const names = (b.serviceNames || []).filter(Boolean);
  if (names.length) return names.join("، ");
  return b.serviceName || "خدمة";
}

export function AppointmentCalendar({
  business,
  role,
  lockedStaffId,
  viewerStaffId,
}: {
  business: Business;
  role: "owner" | "staff";
  lockedStaffId?: string;
  viewerStaffId?: string;
}) {
  const t = useT();
  const actingStaffId = viewerStaffId || lockedStaffId;
  const me = actingStaffId ? business.staff.find((s) => s.id === actingStaffId) : undefined;
  const canOwn = role === "owner" || canEditOwnAppointments(me);
  const canOthers = role === "owner" || canEditOtherStaffAppointments(me);
  const showTeam = role === "owner" || canOthers;
  const actor = calendarActor(role, actingStaffId);
  const [view, setView] = useState<View>(() => (typeof window !== "undefined" && window.innerWidth < 768 ? "day" : "week"));
  const [cursor, setCursor] = useState(isoInBaghdad);
  const [staffFilter, setStaffFilter] = useState(lockedStaffId || "all");
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [selected, setSelected] = useState<BookingRecord | null>(null);
  const [editor, setEditor] = useState<{ date: string; time: string; staffId?: string } | null>(null);
  const [reschedule, setReschedule] = useState<BookingRecord | null>(null);
  const knownIds = useRef<Set<string> | null>(null);
  const focusId = useRef<string | null>(null);
  const reloadLock = useRef(false);
  const reloadAgain = useRef(false);
  const queuedSilent = useRef(true);

  const grid = gridHours(business);
  const hours = useMemo(() => {
    const out: string[] = [];
    for (let t = grid.start; t < grid.end; t += 60) out.push(padHm(t));
    return out;
  }, [grid.end, grid.start]);

  async function reload(opts?: { silent?: boolean }) {
    if (reloadLock.current) {
      reloadAgain.current = true;
      if (!opts?.silent) queuedSilent.current = false;
      return;
    }
    reloadLock.current = true;
    try {
      const rows = await fetchBusinessBookings(business.slug);
      const prev = knownIds.current;
      if (prev) {
        const newcomers = rows.filter((b) => !prev.has(b.id) && visibleOnCalendar(b) && incomingBooking(b));
        newcomers.forEach((b) => prev.add(b.id));
        if (newcomers.length && !opts?.silent) {
          const first = newcomers[0];
          const when = formatAppointmentWhen(first.date, first.time, t.locale);
          const message =
            newcomers.length === 1
              ? t("cal.incomingOne", { name: first.customerName, when })
              : t("cal.incomingMany", { n: newcomers.length, name: first.customerName });
          if (document.visibilityState === "visible") showToast(message);
          else pingDesktop(t("cal.incomingTitle"), message);
          setCursor(first.date);
        }
      }
      knownIds.current = new Set(rows.map((b) => b.id));
      if (focusId.current) {
        const hit = rows.find((b) => b.id === focusId.current);
        if (hit) {
          setCursor(hit.date);
          setSelected(hit);
          focusId.current = null;
        }
      }
      setBookings(rows);
    } finally {
      reloadLock.current = false;
      if (reloadAgain.current) {
        reloadAgain.current = false;
        const silent = queuedSilent.current;
        queuedSilent.current = true;
        void reload({ silent });
      }
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search);
      const date = q.get("date");
      if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        setCursor(date);
        setView("day");
      }
      const id = q.get("id");
      if (id) focusId.current = id;
    }
    knownIds.current = null;
    void reload({ silent: true });
    const tick = () => void reload();
    const timer = window.setInterval(tick, LIVE_POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") void reload({ silent: true });
    };
    document.addEventListener("visibilitychange", onVis);
    const stopLive = subscribeBookingsChanged(business.slug, () => void reload());
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
      stopLive();
    };
  }, [business.slug]);

  const days = view === "week" ? weekDates(cursor) : [cursor];
  const monthDays = monthGrid(cursor);
  const filterId = lockedStaffId || (!showTeam ? actingStaffId : "") || (staffFilter === "all" ? "" : staffFilter);

  const events = bookings.filter((b) => {
    if (!visibleOnCalendar(b)) return false;
    if (filterId && b.staffId !== filterId && b.staffName !== business.staff.find((s) => s.id === filterId)?.name) return false;
    return true;
  });

  function canCreateFor(staffId?: string) {
    if (role === "owner") return true;
    if (!me) return false;
    const targetId = staffId || actingStaffId;
    if (!targetId || targetId === me.id) return canOwn;
    return canOthers;
  }

  function canSchedule(rec: BookingRecord) {
    if (role === "owner") return true;
    if (!me) return false;
    return !staffScheduleDeniedReason(me, rec);
  }

  function canOperate(rec: BookingRecord) {
    if (role === "owner") return true;
    if (!me) return false;
    return isOwnStaffBooking(rec, me) || canOthers;
  }

  function openSlot(date: string, time: string, staffId?: string) {
    const info = holidayInfo(business, date);
    if (info.closed) {
      showToast(info.reason, "err");
      return;
    }
    const staff = lockedStaffId || staffId || (!showTeam ? actingStaffId : undefined);
    if (!canCreateFor(staff)) {
      showToast("ما عندك صلاحية إضافة أو تعديل المواعيد.", "err");
      return;
    }
    if (staff) {
      const person = business.staff.find((s) => s.id === staff);
      if (person?.bookingPaused) {
        showToast("هذا الموظف متوقف عن الحجوزات.", "err");
        return;
      }
    }
    setSelected(null);
    setReschedule(null);
    setEditor({ date, time, staffId: staff });
  }

  async function applyPatch(rec: BookingRecord, nextPatch: Partial<BookingRecord>): Promise<boolean> {
    const next = { ...rec, ...nextPatch };
    upsertBooking(next, actor);
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(rec.manageToken)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...nextPatch, actor }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; booking?: BookingRecord };
      if (!res.ok || data.ok === false) {
        showToast(data.error || "ما انحفظ التعديل.", "err");
        await reload();
        return false;
      }
      setSelected(data.booking || next);
    } catch {
      showToast("خلل بالاتصال.", "err");
      await reload();
      return false;
    }
    await reload();
    return true;
  }

  const now = isoInBaghdad();
  const clock = clockInBaghdad();
  const nowMins = clock.hour * 60 + clock.minute;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gold">{role === "owner" ? "تقويم المشروع" : canOthers ? "تقويم الفريق" : "تقويمي"}</p>
          <h1 className="text-2xl font-bold">{role === "owner" || canOthers ? "كل مواعيد الفريق" : "مواعيدي فقط"}</h1>
          <p className="mt-1 text-sm text-muted">بغداد · {dayLabelAr(cursor, "long")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["week", "day", "month"] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={`nubo-chip ${view === v ? "nubo-chip-on" : ""}`}
              onClick={() => setView(v)}
            >
              {v === "week" ? "أسبوع" : v === "day" ? "يوم" : "شهر"}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            className="nubo-btn nubo-btn-ghost text-sm"
            onClick={() => setCursor(addDaysIso(cursor, view === "month" ? -28 : view === "week" ? -7 : -1))}
          >
            السابق
          </button>
          <button type="button" className="nubo-btn nubo-btn-ghost text-sm" onClick={() => setCursor(isoInBaghdad())}>
            اليوم
          </button>
          <button
            type="button"
            className="nubo-btn nubo-btn-ghost text-sm"
            onClick={() => setCursor(addDaysIso(cursor, view === "month" ? 28 : view === "week" ? 7 : 1))}
          >
            التالي
          </button>
        </div>
        {view === "month" && <p className="font-bold">{monthLabelAr(cursor)}</p>}
        {(role === "owner" || canOwn || canOthers) && (
          <button
            type="button"
            className="nubo-btn nubo-btn-primary text-sm"
            onClick={() => openSlot(view === "month" ? cursor : days[0] || cursor, padHm(Math.max(grid.start, 10 * 60)), lockedStaffId || (!showTeam ? actingStaffId : undefined))}
          >
            موعد جديد
          </button>
        )}
      </div>

      {showTeam && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
              className={`nubo-chip text-xs ${staffFilter === "all" ? "nubo-chip-on" : ""}`}
            onClick={() => setStaffFilter("all")}
          >
            كل الموظفين
          </button>
          {business.staff.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className="nubo-chip text-white"
              style={{ background: staffFilter === s.id ? staffColor(s, i) : hexToRgba(staffColor(s, i), 0.45) }}
              onClick={() => setStaffFilter(s.id)}
            >
              {s.name}
              {s.bookingPaused ? " · متوقف" : ""}
            </button>
          ))}
        </div>
      )}

      {business.bookingIntakePaused && (
        <p className="rounded-2xl bg-sand px-4 py-2 text-sm text-muted">رابط الحجز العام متوقف — تقدر تضيف حضور/هاتف من التقويم.</p>
      )}

      {view === "month" ? (
        <div className="nubo-card overflow-hidden p-3">
          <div className="grid grid-cols-7 text-center text-xs text-muted">
            {["سبت", "أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة"].map((d) => (
              <div key={d} className="py-2 font-semibold">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((iso) => {
              const closed = holidayInfo(business, iso).closed;
              const dayEvents = events.filter((b) => b.date === iso);
              const count = dayEvents.length;
              const inMonth = iso.slice(0, 7) === cursor.slice(0, 7);
              return (
                <div
                  key={iso}
                  className={`nubo-cal-day min-h-[7.5rem] text-right ${
                    iso === now ? "nubo-cal-day--today" : ""
                  } ${closed ? "nubo-cal-day--holiday" : count > 0 ? "nubo-cal-day--booked" : ""} ${inMonth ? "" : "nubo-cal-day--muted"}`}
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-1"
                    onClick={() => {
                      setCursor(iso);
                      setView("day");
                    }}
                  >
                    <span className="font-bold">{Number(iso.slice(8))}</span>
                    {closed && <span className="text-[10px] text-terracotta">عطلة</span>}
                  </button>
                  <div className="mt-1 grid gap-1">
                    {dayEvents.slice(0, 3).map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        data-event
                        className="w-full truncate rounded-md bg-palm px-1 py-0.5 text-right text-[10px] leading-4 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(b);
                        }}
                      >
                        <span className="block truncate font-bold">{b.customerName}</span>
                        <span className="block truncate opacity-90">{serviceLabel(b)}</span>
                      </button>
                    ))}
                    {count > 3 && (
                      <button type="button" className="text-[10px] text-palm" onClick={() => { setCursor(iso); setView("day"); }}>
                        +{count - 3} مواعيد
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="nubo-card overflow-x-auto">
          <div className={view === "day" ? "min-w-0" : "min-w-[52rem] lg:min-w-full"}>
            <div className="grid border-b border-line" style={{ gridTemplateColumns: `4.75rem repeat(${days.length}, minmax(7.5rem, 1fr))` }}>
              <div />
              {days.map((iso) => {
                const closed = holidayInfo(business, iso).closed;
                return (
                  <div key={iso} className={`px-2 py-3 text-center ${iso === now ? "nubo-cal-day--today rounded-xl" : ""}`}>
                    <p className="text-xs text-muted">{weekdayNameAr(iso)}</p>
                    <p className="font-bold">{dayLabelAr(iso)}</p>
                    {closed && <p className="text-[11px] text-terracotta">عطلة — مغلق</p>}
                  </div>
                );
              })}
            </div>
            <div className="relative grid" style={{ gridTemplateColumns: `4.75rem repeat(${days.length}, minmax(7.5rem, 1fr))` }}>
              <div className="relative" style={{ height: (grid.end - grid.start) * PX_PER_MIN }}>
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 px-1 text-[11px] text-muted"
                    style={{ top: (timeToMinutes(h) - grid.start) * PX_PER_MIN }}
                  >
                    {formatTime12(h)}
                  </div>
                ))}
              </div>
              {days.map((iso) => {
                const closed = holidayInfo(business, iso).closed;
                const dayEvents = events.filter((b) => b.date === iso);
                return (
                  <div
                    key={iso}
                    className={`relative border-r border-line ${closed ? "bg-sand/70 nubo-cal-day--holiday" : "bg-surface"}`}
                    style={{ height: (grid.end - grid.start) * PX_PER_MIN }}
                    onClick={(e) => {
                      if (closed) return;
                      if ((e.target as HTMLElement).closest("[data-event]")) return;
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      const time = snapMinutes(e.clientY, rect.top, grid.start, PX_PER_MIN);
                      const slotStaff = lockedStaffId || (!showTeam ? actingStaffId : staffFilter !== "all" ? staffFilter : undefined);
                      if (role === "staff" && !canCreateFor(slotStaff)) return;
                      openSlot(iso, time, slotStaff);
                    }}
                  >
                    {hours.map((h) => (
                      <div
                        key={h}
                        className="absolute left-0 right-0 border-t border-line/70"
                        style={{ top: (timeToMinutes(h) - grid.start) * PX_PER_MIN }}
                      />
                    ))}
                    {iso === now && nowMins >= grid.start && nowMins <= grid.end && (
                      <div className="pointer-events-none absolute left-0 right-0 z-20 h-0.5 bg-palm" style={{ top: (nowMins - grid.start) * PX_PER_MIN }}>
                        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-palm" />
                      </div>
                    )}
                    {dayEvents.map((b) => {
                      const range = bookingRange(b);
                      const staff = business.staff.find((s) => s.id === b.staffId || s.name === b.staffName);
                      const color = staff ? staffColor(staff) : "#ff7802";
                      const pending = b.status === "pending";
                      const height = Math.max(40, (range.end - range.start) * PX_PER_MIN);
                      return (
                        <button
                          key={b.id}
                          type="button"
                          data-event
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(b);
                          }}
                          className="absolute z-10 overflow-hidden rounded-lg px-2 py-1 text-right text-[11px] leading-4 text-white shadow-sm"
                          style={{
                            top: (range.start - grid.start) * PX_PER_MIN,
                            height,
                            right: 6,
                            left: 6,
                            background: pending ? hexToRgba(color, 0.55) : color,
                            border: pending ? "2px dashed #fff" : b.status === "no_show" ? "2px solid #c4511a" : undefined,
                            opacity: b.status === "completed" ? 0.7 : 1,
                          }}
                        >
                          <span className="block truncate font-bold">{b.customerName}</span>
                          <span className="block truncate opacity-95">{serviceLabel(b)}</span>
                          {height >= 56 && pending && <span className="block truncate text-[10px] opacity-80">معلّق</span>}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {selected && (
        <EventDetails
          rec={selected}
          business={business}
          role={role}
          canSchedule={canSchedule(selected)}
          canOperate={canOperate(selected)}
          onClose={() => setSelected(null)}
          onReschedule={() => {
            setReschedule(selected);
            setSelected(null);
          }}
          onPatch={(nextPatch) => void applyPatch(selected, nextPatch)}
          onCancel={async () => {
            const ok = await applyPatch(selected, { status: "cancelled" });
            if (!ok) return;
            void notifyBookingCancelled({ ...selected, status: "cancelled" });
            setSelected(null);
          }}
        />
      )}

      {(editor || reschedule) && (
        <BookingEditor
          business={business}
          bookings={bookings}
          role={role}
          actor={actor}
          lockedStaffId={role === "staff" && !canOthers ? actingStaffId : lockedStaffId}
          preset={editor || undefined}
          existing={reschedule}
          onClose={() => {
            setEditor(null);
            setReschedule(null);
          }}
          onSaved={() => {
            setEditor(null);
            setReschedule(null);
            void reload();
          }}
        />
      )}
    </div>
  );
}

function EventDetails({
  rec,
  business,
  role,
  canSchedule,
  canOperate,
  onClose,
  onReschedule,
  onPatch,
  onCancel,
}: {
  rec: BookingRecord;
  business: Business;
  role: "owner" | "staff";
  canSchedule: boolean;
  canOperate: boolean;
  onClose: () => void;
  onReschedule: () => void;
  onPatch: (patch: Partial<BookingRecord>) => void;
  onCancel: () => void;
}) {
  const staff = business.staff.find((s) => s.id === rec.staffId || s.name === rec.staffName);
  const color = staff ? staffColor(staff) : "#ff7802";
  const canAct = rec.status === "pending" || rec.status === "confirmed";

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/55 p-3 sm:place-items-center" role="dialog">
      <article className="nubo-glass w-full max-w-md p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs" style={{ color }}>
              {staff?.name || rec.staffName} · {sourceLabelAr(rec.source)}
            </p>
            <h2 className="text-xl font-bold">{rec.customerName}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-muted" aria-label="إغلاق">
            ×
          </button>
        </div>
        <span className={`nubo-chip mt-2 text-xs ${rec.status === "pending" ? "nubo-chip-on" : ""}`}>
          {statusLabelAr(rec.status)}
        </span>
        <dl className="mt-4 grid gap-2 text-sm">
          <div>
            <dt className="text-muted">الهاتف</dt>
            <dd dir="ltr">{rec.customerPhone || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">الخدمات</dt>
            <dd>{rec.serviceNames?.join("، ") || rec.serviceName}</dd>
          </div>
          <div>
            <dt className="text-muted">الوقت</dt>
            <dd>
              {formatAppointmentWhen(rec.date, rec.time)} · {rec.durationMin} د
            </dd>
          </div>
        </dl>
        {canAct && (canSchedule || canOperate || role === "owner") && (
          <div className="mt-5 flex flex-wrap gap-2">
            {role === "owner" && rec.status === "pending" && (
              <button type="button" className="nubo-btn nubo-btn-primary text-sm" onClick={() => onPatch({ status: "confirmed" })}>
                تأكيد
              </button>
            )}
            {canSchedule && (
              <button type="button" className="nubo-btn nubo-btn-ghost text-sm" onClick={onReschedule}>
                تغيير الوقت
              </button>
            )}
            {canOperate && (
              <button type="button" className="nubo-btn nubo-btn-ghost text-sm" onClick={() => onPatch({ status: "completed" })}>
                مكتمل
              </button>
            )}
            {canOperate && (
              <button type="button" className="nubo-btn nubo-btn-ghost text-sm" onClick={() => onPatch({ status: "no_show" })}>
                لم يحضر
              </button>
            )}
            {canSchedule && (
              <button type="button" className="nubo-btn text-sm text-terracotta" onClick={onCancel}>
                إلغاء
              </button>
            )}
          </div>
        )}
        {canAct && !canSchedule && role === "staff" && (
          <p className="mt-4 rounded-xl bg-sand px-3 py-2 text-xs leading-6 text-muted">
            عرض فقط لتعديل الجدول. تكدر تعلّم مكتمل أو لم يحضر إذا كان موعدك، أما النقل والإلغاء يحتاجون صلاحية من المدير.
          </p>
        )}
      </article>
    </div>
  );
}
