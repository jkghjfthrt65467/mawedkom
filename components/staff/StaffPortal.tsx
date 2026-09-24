"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppointmentCalendar } from "@/components/calendar/AppointmentCalendar";
import { ARABIC_WEEKDAYS } from "@/lib/availability";
import { businessBySlug } from "@/lib/data";
import { resolveBusiness, withOwnerDefaults } from "@/lib/live-business";
import { formatHoursRange } from "@/lib/booking-message";
import { sortedServices } from "@/lib/services";
import { ImageField, ProjectGalleryField } from "@/components/owner/ImageField";
import { getActiveSlug, getManagedBusiness, getStaffSession, loginStaff, logoutStaff, saveManagedBusiness, STAFF_PIN, subscribeManagedBusiness } from "@/lib/store";
import { showToast } from "@/lib/toast";
import type { Business, Staff } from "@/lib/types";
import { canEditOtherStaffAppointments, canEditOwnAppointments } from "@/lib/staff-permissions";
import { ServicePrice, ServiceTags } from "@/components/ServiceMarks";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useT } from "@/components/LocaleProvider";

const STAFF_NAV = [
  { id: "calendar", label: "التقويم", href: "/staff", icon: "calendar" as IconName },
  { id: "settings", label: "الضبط", href: "/staff/settings", icon: "settings" as IconName },
] as const;

const NAV_PREF_KEY = "mawedkom-staff-nav-v2";

export function StaffPortal({ section = "calendar" }: { section?: "calendar" | "settings" }) {
  const t = useT();
  const overlay = getManagedBusiness();
  const seed = overlay || businessBySlug(getActiveSlug()) || businessBySlug("rafidain-barber")!;
  const [biz, setBiz] = useState<Business>(() => resolveBusiness(seed));
  const [session, setSession] = useState<{ staffId: string; name: string } | null>(null);
  const [staffId, setStaffId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [navCompact, setNavCompact] = useState(false);
  const isCalendar = section === "calendar";

  useEffect(() => {
    const apply = (live: Business) => {
      setBiz(live);
      setSession((prev) => {
        const saved = getStaffSession();
        const id = prev?.staffId || saved?.staffId;
        if (id && live.staff.some((s) => s.id === id)) {
          return prev || saved;
        }
        return prev;
      });
    };
    apply(resolveBusiness(seed));
    setReady(true);
    const unsub = subscribeManagedBusiness(() => apply(resolveBusiness(seed)));
    void fetch(`/api/business?slug=${encodeURIComponent(seed.slug)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { business?: Business }) => {
        if (data.business) {
          apply(withOwnerDefaults({ ...seed, ...data.business, slug: data.business.slug }));
        }
      })
      .catch(() => {});
    return () => unsub();
  }, [seed]);

  useEffect(() => {
    setNavCompact(window.localStorage.getItem(NAV_PREF_KEY) === "compact");
  }, []);

  function toggleNav() {
    setNavCompact((prev) => {
      const next = !prev;
      window.localStorage.setItem(NAV_PREF_KEY, next ? "compact" : "open");
      return next;
    });
  }

  if (!ready) return <p className="text-muted">{t("staff.boot")}</p>;

  if (!session) {
    return (
      <form
        className="nubo-glass mx-auto grid max-w-md gap-3 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          const rec = loginStaff(staffId, pin, biz.staff);
          if (rec) {
            setSession(rec);
            setError("");
          } else {
            setError(t("staff.err"));
          }
        }}
      >
        <p className="text-sm text-gold">{t("staff.portal")}</p>
        <h1 className="text-2xl font-bold">{t("staff.loginTitle")}</h1>
        <p className="text-sm leading-7 text-muted">{t("staff.loginLead", { pin: STAFF_PIN })}</p>
        <label className="grid gap-1 text-sm">
          {t("staff.who")}
          <select className="rounded-2xl border border-line px-3 py-3" value={staffId} onChange={(e) => setStaffId(e.target.value)} required>
            <option value="">{t("staff.pickName")}</option>
            {biz.staff.map((s: Staff) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.bookingPaused ? " (الحجز متوقف)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          {t("staff.pin")}
          <input className="rounded-2xl border border-line px-3 py-3" value={pin} onChange={(e) => setPin(e.target.value)} placeholder={STAFF_PIN} inputMode="numeric" dir="ltr" />
        </label>
        {error && <p className="text-sm text-terracotta">{error}</p>}
        <button className="nubo-btn nubo-btn-primary">{t("staff.enter")}</button>
      </form>
    );
  }

  const me = biz.staff.find((s) => s.id === session.staffId);
  if (!me) {
    logoutStaff();
    return <p className="text-muted">هذا الموظف انحذف. حدّث الصفحة.</p>;
  }

  const canOwn = canEditOwnAppointments(me);
  const canOthers = canEditOtherStaffAppointments(me);
  const weeklyOff = (biz.weeklyOffDays || []).map((d) => ARABIC_WEEKDAYS.find((x) => x.weekday === d)?.name).filter(Boolean);

  return (
    <div className={`grid gap-4 lg:items-start ${navCompact ? "lg:grid-cols-[4.5rem_1fr]" : "lg:grid-cols-[230px_1fr]"} ${isCalendar ? "lg:gap-3" : "lg:gap-6"}`}>
      <aside className={`nubo-glass h-fit p-4 lg:sticky lg:top-20 ${navCompact ? "lg:p-2" : ""}`}>
        <div className={`flex items-start justify-between gap-2 ${navCompact ? "lg:flex-col lg:items-center" : ""}`}>
          <div className={navCompact ? "lg:hidden" : ""}>
            <p className="text-xs text-gold">{t("staff.portal")}</p>
            <p className="mt-1 font-bold">{me.name}</p>
            <p className="text-xs text-muted">{me.role}</p>
          </div>
          <button
            type="button"
            className="hidden h-10 w-10 place-items-center rounded-full border border-line text-muted hover:text-palm lg:grid"
            onClick={toggleNav}
            aria-label={navCompact ? t("owner.expand") : t("owner.collapse")}
            title={navCompact ? t("owner.expand") : t("owner.collapse")}
          >
            <Icon name={navCompact ? "menu" : "chevron"} className="h-5 w-5" />
          </button>
        </div>
        <nav className={`mt-3 grid gap-1 text-sm ${navCompact ? "lg:justify-items-center" : ""}`}>
          {STAFF_NAV.map((s) => (
            <Link
              key={s.id}
              href={s.href}
              className={`nubo-nav-item gap-2 text-right ${navCompact ? "lg:h-11 lg:w-11 lg:justify-center lg:p-0" : ""} ${section === s.id ? "nubo-nav-item-on" : "hover:bg-sand"}`}
              aria-label={t(`staff.${s.id}`)}
              title={t(`staff.${s.id}`)}
            >
              <Icon name={s.icon} className="h-5 w-5" />
              <span className={navCompact ? "lg:hidden" : ""}>{t(`staff.${s.id}`)}</span>
            </Link>
          ))}
        </nav>
        <button
          type="button"
          className={`mt-4 text-right text-sm text-terracotta ${navCompact ? "lg:hidden" : ""}`}
          onClick={() => {
            logoutStaff();
            setSession(null);
          }}
        >
          {t("staff.logout")}
        </button>
        {navCompact && (
          <button
            type="button"
            className="mt-3 hidden h-11 w-11 place-items-center rounded-full text-terracotta lg:grid"
            onClick={() => {
              logoutStaff();
              setSession(null);
            }}
            aria-label="خروج"
            title="خروج"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        )}
      </aside>

      <div className="space-y-4 min-w-0">
        {section === "calendar" && (
          <>
            <div className="nubo-card p-4">
              <p className="text-sm text-muted">
                مرحباً {me.name}
                {me.bookingPaused ? " — المدير موقف استقبال حجوزاتك من الرابط العام." : ""}
              </p>
              <p className="mt-1 text-xs leading-6 text-muted">
                {canOthers
                  ? "تشوف تقويم الفريق وتقدر تعدّل مواعيد الباقين."
                  : canOwn
                    ? "تعدّل مواعيدك فقط. مواعيد باقي الموظفين مخفية."
                    : "عرض مواعيدك فقط — النقل والإلغاء مقفولين إلى أن يفعّلهم المدير."}
              </p>
            </div>
            <AppointmentCalendar business={biz} role="staff" viewerStaffId={me.id} lockedStaffId={canOthers ? undefined : me.id} />
          </>
        )}

        {section === "settings" && (
          <div className="space-y-4">
            <header>
              <p className="text-xs text-gold">ضبط المشروع</p>
              <h1 className="text-2xl font-bold">الضبط</h1>
              <p className="mt-1 text-sm text-muted">جدول المشروع والعطل والخدمات. التعديل على المدير من لوحة الضبط.</p>
            </header>
            <article className="nubo-card grid gap-3 p-5">
              <h2 className="font-bold">حسابك وبروفايلك</h2>
              <div className="flex items-center gap-3">
                {me.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={me.photo} alt="" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-palm-soft font-bold text-palm">{me.initials}</div>
                )}
                <div>
                  <p className="font-semibold">{me.name}</p>
                  <p className="text-sm text-muted">{me.role}</p>
                  {me.bookingPaused && <p className="text-xs text-terracotta">الحجوزات متوقفة عليك</p>}
                </div>
              </div>
              <p className="text-xs leading-6 text-muted">
                {canOthers ? "صلاحية: تعدّل مواعيدك ومواعيد باقي الموظفين." : canOwn ? "صلاحية: تعدّل مواعيدك فقط." : "صلاحية: عرض فقط."}
              </p>
              <label className="grid gap-1 text-sm">
                نبذة عنك
                <textarea
                  className="min-h-24 rounded-2xl border border-line px-3 py-3"
                  value={me.bio || ""}
                  onChange={(e) => {
                    const next = { ...biz, staff: biz.staff.map((s) => (s.id === me.id ? { ...s, bio: e.target.value } : s)) };
                    setBiz(next);
                  }}
                />
              </label>
              <button
                type="button"
                className="nubo-btn nubo-btn-primary justify-self-start"
                onClick={() => {
                  saveManagedBusiness(biz);
                  showToast("انحفظت النبذة");
                }}
              >
                حفظ النبذة
              </button>
              <ImageField
                label="صورتك الشخصية"
                value={me.photo || ""}
                onChange={(photo) => {
                  const next = { ...biz, staff: biz.staff.map((s) => (s.id === me.id ? { ...s, photo } : s)) };
                  setBiz(next);
                  saveManagedBusiness(next);
                }}
                slug={biz.slug}
                actor="staff"
                kind="staff"
                staffId={me.id}
                circle
                hint="تظهر بصفحتك العامة وبقائمة الفريق."
              />
              <ProjectGalleryField
                photos={me.galleryPhotos || []}
                onChange={(galleryPhotos) => {
                  const next = { ...biz, staff: biz.staff.map((s) => (s.id === me.id ? { ...s, galleryPhotos } : s)) };
                  setBiz(next);
                  saveManagedBusiness(next);
                }}
                slug={biz.slug}
                actor="staff"
                staffId={me.id}
                title="صور شغلك"
              />
              <Link href={`/salon/${biz.slug}/staff/${me.id}`} className="text-sm font-semibold text-palm">
                شوف بروفايلك العام
              </Link>
            </article>
            <article className="nubo-card grid gap-2 p-5">
              <h2 className="font-bold">ساعات العمل</h2>
              <ul className="text-sm text-muted">
                {biz.hours.map((h) => (
                  <li key={h.days}>
                    {h.days}: {formatHoursRange(h.open, h.close)}
                  </li>
                ))}
              </ul>
              {weeklyOff.length > 0 && <p className="text-sm text-terracotta">عطل أسبوعية: {weeklyOff.join("، ")}</p>}
            </article>
            {(biz.holidayDates || []).length > 0 && (
              <article className="nubo-card grid gap-2 p-5">
                <h2 className="font-bold">أيام الإغلاق</h2>
                <p className="text-sm text-muted">{(biz.holidayDates || []).join("، ")}</p>
              </article>
            )}
            <article className="nubo-card grid gap-2 p-5">
              <h2 className="font-bold">الخدمات</h2>
              <ul className="grid gap-2 text-sm">
                {sortedServices(biz.services)
                  .filter((s) => me.serviceIds.includes(s.id))
                  .map((s) => (
                    <li key={s.id} className="flex justify-between gap-3">
                      <span>
                        <span className="block">{s.name}</span>
                        <ServiceTags s={s} />
                      </span>
                      <span className="text-muted">
                        {s.durationMin} د · <ServicePrice s={s} className="inline text-muted" />
                      </span>
                    </li>
                  ))}
              </ul>
            </article>
          </div>
        )}
      </div>
    </div>
  );
}
