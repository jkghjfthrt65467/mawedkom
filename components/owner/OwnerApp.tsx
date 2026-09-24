"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ImageField, ProjectGalleryField } from "@/components/owner/ImageField";
import { MapPicker } from "@/components/owner/MapPicker";
import { AppointmentCalendar } from "@/components/calendar/AppointmentCalendar";
import { ProjectStats, StatsSummaryCard } from "@/components/owner/ProjectStats";
import { ARABIC_WEEKDAYS, hoursSummary, initialsFromName, weekdayHoursFromLegacy } from "@/lib/availability";
import { businessBySlug } from "@/lib/data";
import { formatDateLatn, formatTimeLatn } from "@/lib/latin-digits";
import { AR_IQ_LATN } from "@/lib/locale";
import { resolveBusiness, withOwnerDefaults } from "@/lib/live-business";
import { fetchMediaOverlay } from "@/lib/media-client";
import { bookingsForBusiness, calendarActor, fetchBusinessBookings, getActiveSlug, getManagedBusiness, logoutManager, MANAGED_SLUG, saveManagedBusiness, updateBooking } from "@/lib/store";
import { showToast } from "@/lib/toast";
import type { BookingRecord, Business, CustomerProfile, DaySchedule, Service, Staff } from "@/lib/types";
import { formatAppointmentWhen, statusLabelAr } from "@/lib/booking-message";
import { DirectBookingLink } from "@/components/owner/DirectBookingLink";
import { WhatsAppSettings } from "@/components/owner/WhatsAppSettings";
import { PlansGrid } from "@/components/PlansGrid";
import { Time12Select } from "@/components/Time12Select";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ServicePrice, ServiceTags } from "@/components/ServiceMarks";
import { rollMetaMonth, topUpWallet, walletOf } from "@/lib/billing";
import { bookingLimitLabel, canActivateFree, canAddStaff, formatUsd, freeTrialExpired, freeTrialMessage, monthBookingCount, planOf, quotaReached, resolveNotifyChannel, staffLimitLabel } from "@/lib/plans";
import { moveService, reindexServices, sortedServices, withServiceDefaults } from "@/lib/services";
import { useT } from "@/components/LocaleProvider";

export const OWNER_NAV = [
  { id: "overview", label: "نظرة عامة", icon: "home" as IconName },
  { id: "calendar", label: "التقويم", icon: "calendar" as IconName },
  { id: "bookings", label: "المواعيد", icon: "clock" as IconName },
  { id: "customers", label: "الزبائن", icon: "user" as IconName },
  { id: "stats", label: "الإحصائيات", icon: "spark" as IconName },
  { id: "settings", label: "الضبط", icon: "settings" as IconName },
] as const;

const NAV_PREF_KEY = "mawedkom-owner-nav-v2";

export const SETTINGS_TABS = [
  { id: "project", label: "المشروع" },
  { id: "staff", label: "الموظفون" },
  { id: "services", label: "الخدمات" },
  { id: "hours", label: "ساعات العمل" },
  { id: "holidays", label: "العطل والإغلاق" },
  { id: "plan", label: "الخطة" },
  { id: "booking", label: "الحجز والإشعارات" },
  { id: "whatsapp", label: "واتساب" },
] as const;

const ALL_SECTIONS = [...OWNER_NAV, ...SETTINGS_TABS] as const;

export type OwnerSection = (typeof ALL_SECTIONS)[number]["id"];

function isSettingsTab(id: string): id is (typeof SETTINGS_TABS)[number]["id"] {
  return SETTINGS_TABS.some((t) => t.id === id);
}

export function OwnerApp({ section }: { section: string }) {
  const t = useT();
  const router = useRouter();
  const overlay = getManagedBusiness();
  const startSlug = overlay?.slug || getActiveSlug() || MANAGED_SLUG;
  const catalog = businessBySlug(startSlug) || businessBySlug(MANAGED_SLUG)!;
  const [biz, setBiz] = useState<Business>(() =>
    resolveBusiness(overlay ? { ...catalog, ...overlay, slug: overlay.slug } : catalog),
  );
  const [savedAt, setSavedAt] = useState("");
  const [dirty, setDirty] = useState(false);
  const [navCompact, setNavCompact] = useState(false);
  const current = (ALL_SECTIONS.some((s) => s.id === section) ? section : "overview") as OwnerSection;
  const settingsTab = current === "settings" ? "project" : isSettingsTab(current) ? current : null;
  const navId = settingsTab ? "settings" : current;
  const isCalendar = current === "calendar";

  useEffect(() => {
    const boot = async () => {
      const slug = getManagedBusiness()?.slug || getActiveSlug();
      try {
        const res = await fetch(`/api/business?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
        const data = (await res.json()) as { business?: Business };
        if (data.business) {
          const overlayNow = getManagedBusiness();
          const merged = withOwnerDefaults({
            ...data.business,
            ...(overlayNow && overlayNow.slug === data.business.slug ? overlayNow : {}),
            slug: data.business.slug,
          });
          saveManagedBusiness(merged);
          setBiz(merged);
          return;
        }
      } catch {
        /* overlay */
      }
      const live = resolveBusiness(getManagedBusiness() || businessBySlug(slug) || catalog);
      setBiz(live);
      saveManagedBusiness(live);
    };
    void boot();
    void fetchMediaOverlay().then(() => {
      const overlayNow = getManagedBusiness();
      if (overlayNow) setBiz(resolveBusiness(overlayNow));
    });
  }, [catalog]);

  function persist(next: Business, toast = true) {
    const ready = withOwnerDefaults({
      ...next,
      hours: hoursSummary(next.weekdayHours || []),
      holidayDates: (next.holidayDates || []).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)),
    });
    setBiz(ready);
    saveManagedBusiness(ready);
    setDirty(false);
    const when = formatTimeLatn(new Date(), { hour: "numeric", minute: "2-digit", hour12: true }, AR_IQ_LATN);
    setSavedAt(when);
    if (toast) showToast(t("toast.ownerSaved"));
  }

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

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

  function allowLeave() {
    if (!dirty) return true;
    return window.confirm(t("owner.leave"));
  }

  function go(href: string) {
    if (!allowLeave()) return;
    setDirty(false);
    router.push(href);
  }

  return (
    <div className={`grid gap-4 lg:items-start ${navCompact ? "lg:grid-cols-[4.5rem_1fr]" : "lg:grid-cols-[230px_1fr]"} ${isCalendar ? "lg:gap-3" : "lg:gap-6"}`}>
      <aside className={`nubo-glass h-fit p-4 lg:sticky lg:top-20 ${navCompact ? "lg:p-2" : ""}`}>
        <div className={`flex items-start justify-between gap-2 ${navCompact ? "lg:flex-col lg:items-center" : ""}`}>
          <div className={navCompact ? "lg:hidden" : ""}>
            <p className="text-xs text-gold">{t("owner.role")}</p>
            <p className="mt-1 font-bold">{biz.name}</p>
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
          {OWNER_NAV.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => go(s.id === "overview" ? "/business/manage" : `/business/manage/${s.id}`)}
              className={`nubo-nav-item gap-2 text-right ${navCompact ? "lg:h-11 lg:w-11 lg:justify-center lg:p-0" : ""} ${navId === s.id ? "nubo-nav-item-on" : "hover:bg-sand"}`}
              aria-label={t(`owner.${s.id}`)}
              title={t(`owner.${s.id}`)}
            >
              <Icon name={s.icon} className="h-5 w-5" />
              <span className={navCompact ? "lg:hidden" : ""}>{t(`owner.${s.id}`)}</span>
            </button>
          ))}
        </nav>
        {dirty && (
          <p className={`mt-3 rounded-xl bg-terracotta/10 px-3 py-2 text-xs leading-6 text-terracotta ${navCompact ? "lg:hidden" : ""}`}>
            عندك تعديلات ما انحفظت. احفظ من زر الحفظ قبل ما تغيّر الصفحة، حتى ما تلغي.
          </p>
        )}
        {dirty && navCompact && (
          <span className="mx-auto mt-2 hidden h-2 w-2 rounded-full bg-terracotta lg:block" title="عندك تعديلات ما انحفظت" />
        )}
        <div className={`mt-4 grid gap-2 text-sm ${navCompact ? "lg:hidden" : ""}`}>
          <button type="button" className="text-right text-palm" onClick={() => go(`/salon/${biz.slug}`)}>
            صفحة المشروع العامة
          </button>
          <DirectBookingLink slug={biz.slug} compact />
          <button
            type="button"
            className="text-right text-terracotta"
            onClick={() => {
              if (!allowLeave()) return;
              logoutManager();
              router.push("/business");
            }}
          >
            خروج المدير
          </button>
        </div>
        {navCompact && (
          <button
            type="button"
            className="mt-3 hidden h-11 w-11 place-items-center rounded-full text-terracotta lg:grid"
            onClick={() => {
              if (!allowLeave()) return;
              logoutManager();
              router.push("/business");
            }}
            aria-label="خروج المدير"
            title="خروج المدير"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        )}
        {savedAt && <p className={`mt-3 text-xs text-muted ${navCompact ? "lg:hidden" : ""}`}>آخر حفظ {savedAt}</p>}
      </aside>

      <div className="space-y-4 min-w-0">
        {current === "overview" && <Overview biz={biz} onChange={persist} onDirty={() => setDirty(true)} onLeave={go} />}
        {current === "calendar" && <AppointmentCalendar business={biz} role="owner" />}
        {current === "stats" && <ProjectStats business={biz} />}
        {current === "bookings" && <BookingsSection slug={biz.slug} />}
        {current === "customers" && <CustomersSection slug={biz.slug} />}
        {settingsTab && (
          <SettingsHub tab={settingsTab} biz={biz} onChange={persist} onDirty={() => setDirty(true)} onLeave={go} />
        )}
      </div>
    </div>
  );
}

type Persist = (b: Business, toast?: boolean) => void;
type Dirty = () => void;

function SettingsHub({
  tab,
  biz,
  onChange,
  onDirty,
  onLeave,
}: {
  tab: (typeof SETTINGS_TABS)[number]["id"];
  biz: Business;
  onChange: Persist;
  onDirty: Dirty;
  onLeave: (href: string) => void;
}) {
  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs text-gold">ضبط المشروع</p>
        <h1 className="text-2xl font-bold">الضبط</h1>
        <p className="mt-1 text-sm text-muted">كل إعدادات المشروع بمكان واحد: البيانات، الموظفون، الخدمات، الدوام، العطل، الحجز، وواتساب.</p>
      </header>
      <nav className="flex flex-wrap gap-2">
        {SETTINGS_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onLeave(`/business/manage/${t.id === "project" ? "settings" : t.id}`)}
            className={`nubo-chip text-sm ${tab === t.id ? "nubo-chip-on" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </nav>
      {tab === "project" && <ProjectSection biz={biz} onChange={onChange} onDirty={onDirty} />}
      {tab === "staff" && <StaffSection biz={biz} onChange={onChange} onDirty={onDirty} />}
      {tab === "services" && <ServicesSection biz={biz} onChange={onChange} onDirty={onDirty} />}
      {tab === "hours" && <HoursSection biz={biz} onChange={onChange} onDirty={onDirty} />}
      {tab === "holidays" && <HolidaysSection biz={biz} onChange={onChange} onDirty={onDirty} />}
      {tab === "plan" && <PlanSection biz={biz} onChange={onChange} />}
      {tab === "booking" && <SettingsSection biz={biz} onChange={onChange} onDirty={onDirty} />}
      {tab === "whatsapp" && <WhatsAppSettings biz={biz} />}
    </div>
  );
}

function PlanSection({ biz, onChange }: { biz: Business; onChange: Persist }) {
  const plan = planOf(biz);
  const [used, setUsed] = useState(0);
  useEffect(() => {
    void fetchBusinessBookings(biz.slug).then((rows) => setUsed(monthBookingCount(rows, biz.slug)));
  }, [biz.slug]);
  useEffect(() => {
    if (plan.family !== "meta") return;
    const rolled = rollMetaMonth(biz);
    if (rolled.metaMonthKey === biz.metaMonthKey && rolled.metaWalletUsd === biz.metaWalletUsd) return;
    onChange(rolled, false);
    // month-rollover only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biz.slug, biz.metaMonthKey, plan.family]);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">خطة المشروع</h1>
        <p className="mt-1 text-sm leading-7 text-muted">
          أنت على {plan.name}: {staffLimitLabel(plan)} و{bookingLimitLabel(plan)}.
          {plan.bookingsPerMonth != null ? ` هالشهر استخدمت ${used} من ${plan.bookingsPerMonth}.` : ` هالشهر ${used} حجز.`}
          {plan.id === "free" ? ` ${freeTrialMessage(biz)}` : ""}
          تقدر تغيّر نوع خطتك من البطاقات. التفعيل حالياً عبر الدعم الفني فقط.
        </p>
      </div>
      {freeTrialExpired(biz) && (
        <p className="rounded-2xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
          التجربة المجانية انتهت. اطلب خطة مدفوعة، والدعم الفني يفعّلها.
        </p>
      )}
      {plan.family === "meta" && (
        <div className="nubo-card space-y-3 p-5">
          <p className="font-bold">رصيد إشعارات المنصة: {formatUsd(walletOf(biz))}</p>
          <p className="text-sm leading-7 text-muted">
            اشتراك 10$ بالشهر + 0.05$ لكل حجز. الرسائل تطلع من نظام إشعارات المنصة.
          </p>
          <div className="flex flex-wrap gap-2">
            {[10, 20, 50].map((amount) => (
              <button
                key={amount}
                type="button"
                className="nubo-btn nubo-btn-primary text-sm"
                onClick={() => {
                  onChange(topUpWallet(biz, amount), false);
                  showToast(`تم شحن ${formatUsd(amount)}`);
                }}
              >
                شحن {formatUsd(amount)}
              </button>
            ))}
          </div>
        </div>
      )}
      {biz.requestedPlanId && biz.requestedPlanId !== plan.id && (
        <p className="rounded-2xl bg-sand px-4 py-3 text-sm leading-7 text-muted">
          طلبك: {planOf({ planId: biz.requestedPlanId }).name}. الدعم الفني يفعّلها.{" "}
          <Link href="/contact" className="font-semibold text-palm">
            تواصل ويا الدعم
          </Link>
        </p>
      )}
      <PlansGrid
        currentId={plan.id}
        requestedId={biz.requestedPlanId}
        business={biz}
        onPick={(next) => {
          if (next.id === "free" && !canActivateFree(biz) && plan.id !== "free") {
            showToast("العرض المجاني مرة واحدة ولمدة 30 يوم فقط.", "err");
            return;
          }
          onChange({ ...biz, requestedPlanId: next.id }, false);
          showToast(`طلب ${next.name} انحفظ. الدعم الفني يفعّل الخطة.`);
        }}
      />
    </div>
  );
}

function Overview({ biz, onChange, onLeave }: { biz: Business; onChange: Persist; onDirty: Dirty; onLeave: (href: string) => void }) {
  const t = useT();
  const pausedStaff = biz.staff.filter((s) => s.bookingPaused).length;
  const holidays = (biz.holidayDates || []).length;
  const plan = planOf(biz);
  const [monthUsed, setMonthUsed] = useState(0);
  useEffect(() => {
    void fetchBusinessBookings(biz.slug).then((rows) => setMonthUsed(monthBookingCount(rows, biz.slug)));
  }, [biz.slug]);
  const bookingLabel = plan.bookingsPerMonth == null ? `${monthUsed} حجز هالشهر` : `${monthUsed} / ${plan.bookingsPerMonth} حجز هالشهر`;
  return (
    <div className="space-y-4">
      <header className="nubo-card-ink overflow-hidden p-6">
        <p className="text-sm text-gold">{t("owner.banner")}</p>
        <h1 className="mt-1 text-3xl font-bold">{biz.name}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-ink/80">{biz.about}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="nubo-btn nubo-btn-gold" onClick={() => onLeave("/business/manage/calendar")}>
            التقويم
          </button>
          <button type="button" className="nubo-btn nubo-btn-ghost" onClick={() => onLeave("/business/manage/settings")}>
            الضبط
          </button>
          <button type="button" className="nubo-btn nubo-btn-ghost" onClick={() => onLeave("/business/manage/plan")}>
            الخطة: {plan.name}
          </button>
          <button type="button" className="nubo-btn nubo-btn-ghost" onClick={() => onLeave("/business/manage/stats")}>
            الإحصائيات
          </button>
          <button type="button" className="nubo-btn nubo-btn-ghost" onClick={() => onLeave("/business/manage/customers")}>
            الزبائن
          </button>
        </div>
      </header>
      <DirectBookingLink slug={biz.slug} />
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          [`${biz.staff.length}${plan.staffLimit != null ? ` / ${plan.staffLimit}` : ""}`, "موظف"],
          [bookingLabel, plan.name],
          [`${(biz.weeklyOffDays || []).length + holidays}`, "يوم عطلة مضبوط"],
        ].map(([n, l]) => (
          <div key={l} className="nubo-card p-4">
            <p className="text-2xl font-bold text-palm">{n}</p>
            <p className="text-sm text-muted">{l}</p>
          </div>
        ))}
      </div>
      {pausedStaff > 0 && <p className="text-sm text-muted">{pausedStaff} موظف متوقف عن الحجوزات.</p>}
      {plan.id === "free" && !freeTrialExpired(biz) && (
        <p className="rounded-2xl bg-sand px-4 py-3 text-sm text-muted">{freeTrialMessage(biz)}</p>
      )}
      {freeTrialExpired(biz) && (
        <p className="rounded-2xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
          التجربة المجانية انتهت. رقّي الخطة حتى يستمر رابط الحجز.
        </p>
      )}
      {quotaReached(biz, monthUsed) && (
        <p className="rounded-2xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
          وصلت حد الحجوزات بهالشهر. رقّي الخطة من الضبط حتى يستمر الرابط.
        </p>
      )}
      <StatsSummaryCard business={biz} />
      <div className="nubo-card flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="font-bold">استقبال الحجوزات</p>
          <p className="text-sm text-muted">
            {biz.bookingIntakePaused ? "الرابط متوقف — الزبون ما يكمّل حجز." : "الرابط مفتوح 7/24 حسب العطل والموظفين."}
          </p>
        </div>
        <button
          type="button"
          className={`nubo-btn ${biz.bookingIntakePaused ? "nubo-btn-primary" : "nubo-btn-ghost"}`}
          onClick={() => onChange({ ...biz, bookingIntakePaused: !biz.bookingIntakePaused })}
        >
          {biz.bookingIntakePaused ? "إعادة فتح الحجز" : "إيقاف الحجوزات"}
        </button>
      </div>
    </div>
  );
}

function ProjectSection({ biz, onChange, onDirty }: { biz: Business; onChange: Persist; onDirty: Dirty }) {
  const [draft, setDraft] = useState(biz);
  useEffect(() => setDraft(biz), [biz]);
  function edit(next: Business) {
    setDraft(next);
    onDirty();
  }

  return (
    <form
      className="nubo-card grid gap-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        onChange(draft);
      }}
    >
      <h1 className="text-2xl font-bold">المشروع</h1>
      <p className="text-sm text-muted">الاسم والوصف والصورة والهاتف والموقع يظهرون بصفحة الصالون والقائمة والحجز.</p>
      <label className="grid gap-1 text-sm">
        اسم المشروع
        <input
          name="project-name"
          className="rounded-2xl border border-line px-3 py-3"
          value={draft.name}
          onChange={(e) => edit({ ...draft, name: e.target.value })}
          required
        />
      </label>
      <label className="grid gap-1 text-sm">
        وصف المشروع
        <textarea
          name="project-about"
          className="min-h-28 rounded-2xl border border-line px-3 py-3"
          value={draft.about}
          onChange={(e) => edit({ ...draft, about: e.target.value })}
        />
      </label>
      <ImageField
        label="الصورة الشخصية"
        value={draft.avatar || ""}
        onChange={(avatar) => edit({ ...draft, avatar })}
        slug={draft.slug}
        actor="owner"
        kind="avatar"
        circle
        hint="دائرة هوية المشروع. تظهر بشريط الحجز وصفحة المشروع."
      />
      <ImageField
        label="صورة الغلاف"
        value={draft.coverPhoto || draft.photo || ""}
        onChange={(coverPhoto) => edit({ ...draft, coverPhoto, photo: coverPhoto })}
        slug={draft.slug}
        actor="owner"
        kind="cover"
        hint="صورة عريضة لأعلى الصفحة وبطاقة القائمة. غير الصورة الشخصية."
      />
      <ProjectGalleryField
        photos={draft.galleryPhotos || []}
        onChange={(galleryPhotos) => edit({ ...draft, galleryPhotos })}
        slug={draft.slug}
        actor="owner"
      />
      <label className="grid gap-1 text-sm">
        رقم هاتف المشروع
        <input
          name="project-phone"
          className="rounded-2xl border border-line px-3 py-3"
          dir="ltr"
          value={draft.phone}
          onChange={(e) => edit({ ...draft, phone: e.target.value })}
        />
      </label>
      <label className="grid gap-1 text-sm">
        العنوان
        <input
          name="project-address"
          className="rounded-2xl border border-line px-3 py-3"
          value={draft.address}
          onChange={(e) => edit({ ...draft, address: e.target.value })}
        />
      </label>
      <div>
        <p className="mb-2 text-sm font-medium">موقع الخريطة</p>
        <MapPicker
          lat={draft.lat ?? 33.3152}
          lng={draft.lng ?? 44.3661}
          onChange={(lat, lng, address) => edit({ ...draft, lat, lng, address: address || draft.address })}
        />
      </div>
      <button className="nubo-btn nubo-btn-primary justify-self-start">حفظ المشروع</button>
    </form>
  );
}

function StaffSection({ biz, onChange, onDirty }: { biz: Business; onChange: Persist; onDirty: Dirty }) {
  const [draft, setDraft] = useState(biz.staff);
  useEffect(() => setDraft(biz.staff), [biz.staff]);
  function updateStaff(id: string, patch: Partial<Staff>) {
    setDraft((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    onDirty();
  }
  function addStaff() {
    if (!canAddStaff({ ...biz, staff: draft })) {
      const plan = planOf(biz);
      showToast(`خطتك (${plan.name}) تسمح بـ ${staffLimitLabel(plan)}. رقّي الخطة.`, "err");
      return;
    }
    const id = `st-${Date.now()}`;
    const name = "موظف جديد";
    setDraft((prev) => [
      ...prev,
      {
        id,
        name,
        role: "موظف",
        initials: initialsFromName(name),
        serviceIds: biz.services.map((s) => s.id),
        photo: "",
        bio: "",
        bookingPaused: false,
        canEditOwnAppointments: true,
        canEditOtherStaffAppointments: false,
      },
    ]);
    onDirty();
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">الموظفون</h1>
          <p className="text-sm text-muted">
            اسم، رقم واتساب للتنبيه، صورة، نبذة، خدمات، صلاحيات المواعيد. خطتك ({planOf(biz).name}): {staffLimitLabel(planOf(biz))}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="nubo-btn nubo-btn-ghost" onClick={() => onChange({ ...biz, staff: draft })}>
            حفظ الموظفين
          </button>
          <button type="button" className="nubo-btn nubo-btn-primary" onClick={addStaff} disabled={!canAddStaff(biz)}>
            إضافة موظف
          </button>
        </div>
      </div>
      {draft.map((s) => (
        <article key={s.id} className="nubo-card grid gap-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="font-bold">{s.name}</p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(s.bookingPaused)}
                onChange={(e) => updateStaff(s.id, { bookingPaused: e.target.checked })}
              />
              إيقاف الحجوزات
            </label>
          </div>
          {s.bookingPaused && (
            <p className="rounded-xl bg-terracotta/10 px-3 py-2 text-xs text-terracotta">هذا الموظف مخفي/معطّل في معالج الحجز إلى أن تشيل الإيقاف.</p>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm">
              الاسم
              <input
                className="rounded-2xl border border-line px-3 py-3"
                value={s.name}
                onChange={(e) => updateStaff(s.id, { name: e.target.value, initials: initialsFromName(e.target.value) })}
              />
            </label>
            <label className="grid gap-1 text-sm">
              الدور / التخصص
              <input className="rounded-2xl border border-line px-3 py-3" value={s.role} onChange={(e) => updateStaff(s.id, { role: e.target.value })} />
            </label>
            <label className="grid gap-1 text-sm md:col-span-2">
              رقم واتساب للتنبيه
              <input
                className="rounded-2xl border border-line px-3 py-3"
                dir="ltr"
                inputMode="tel"
                value={s.phone || ""}
                onChange={(e) => updateStaff(s.id, { phone: e.target.value })}
                placeholder="07xxxxxxxxx"
              />
              <span className="text-xs leading-6 text-muted">اختياري. إذا انحجز عليه موعد، يوصله واتساب مع رابط صفحة التقويم.</span>
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            الوصف / النبذة
            <textarea className="min-h-20 rounded-2xl border border-line px-3 py-3" value={s.bio || ""} onChange={(e) => updateStaff(s.id, { bio: e.target.value })} />
          </label>
          <ImageField
            label="صورة الموظف"
            value={s.photo || ""}
            onChange={(photo) => updateStaff(s.id, { photo })}
            slug={biz.slug}
            actor="owner"
            kind="staff"
            staffId={s.id}
            circle
            hint="تظهر ببروفايل الموظف وصفحة المشروع والحجز."
          />
          <ProjectGalleryField
            photos={s.galleryPhotos || []}
            onChange={(galleryPhotos) => updateStaff(s.id, { galleryPhotos })}
            slug={biz.slug}
            actor="owner"
            staffId={s.id}
            title="صور بروفايل الموظف"
          />
          <fieldset className="grid gap-2 rounded-2xl bg-sand/70 p-4">
            <legend className="text-sm font-medium">صلاحيات المواعيد</legend>
            <p className="text-xs leading-6 text-muted">
              الافتراضي: يعدّل مواعيده مفعّل، وتعديل مواعيد باقي الموظفين مطفّى. صلاحية الباقين تخليه يشوف تقويم الفريق ملوّن ويعدّل عليهم، بدون ما يصير مدير مشروع.
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={s.canEditOwnAppointments !== false}
                onChange={(e) => updateStaff(s.id, { canEditOwnAppointments: e.target.checked })}
              />
              يعدّل مواعيده
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(s.canEditOtherStaffAppointments)}
                onChange={(e) => updateStaff(s.id, { canEditOtherStaffAppointments: e.target.checked })}
              />
              يعدّل مواعيد باقي الموظفين
            </label>
          </fieldset>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">الخدمات التي يقدّمها</legend>
            <div className="flex flex-wrap gap-2">
              {sortedServices(biz.services).map((svc) => (
                <label key={svc.id} className="nubo-chip text-xs">
                  <input
                    type="checkbox"
                    checked={s.serviceIds.includes(svc.id)}
                    onChange={(e) =>
                      updateStaff(s.id, {
                        serviceIds: e.target.checked ? [...s.serviceIds, svc.id] : s.serviceIds.filter((id) => id !== svc.id),
                      })
                    }
                  />
                  {svc.name}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="grid gap-3 rounded-2xl bg-sand/70 p-4">
            <legend className="text-sm font-medium">دوام هذا الموظف</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(s.weekdayHours?.length)}
                onChange={(e) =>
                  updateStaff(
                    s.id,
                    {
                      weekdayHours: e.target.checked
                        ? (biz.weekdayHours?.length ? biz.weekdayHours : weekdayHoursFromLegacy(biz.hours)).map((d) => ({ ...d }))
                        : undefined,
                    },
                  )
                }
              />
              ساعات خاصة، مو ساعات المحل
            </label>
            {s.weekdayHours?.length ? (
              <div className="grid gap-2">
                {ARABIC_WEEKDAYS.map((d) => {
                  const row =
                    s.weekdayHours?.find((x) => x.weekday === d.weekday) ||
                    ({ weekday: d.weekday, closed: false, open: "09:00", close: "22:00" } satisfies DaySchedule);
                  const setDay = (patch: Partial<DaySchedule>) =>
                    updateStaff(s.id, {
                      weekdayHours: (s.weekdayHours || []).map((x) => (x.weekday === d.weekday ? { ...x, ...patch } : x)),
                    });
                  return (
                    <div key={d.weekday} className="grid items-center gap-2 sm:grid-cols-[5.5rem_auto_1fr_1fr]">
                      <p className="text-sm font-semibold">{d.name}</p>
                      <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" checked={row.closed} onChange={(e) => setDay({ closed: e.target.checked })} />
                        مغلق
                      </label>
                      <Time12Select disabled={row.closed} value={row.open} onChange={(open) => setDay({ open })} />
                      <Time12Select disabled={row.closed} value={row.close} onChange={(close) => setDay({ close })} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted">يتبع ساعات عمل المشروع.</p>
            )}
            <p className="text-xs font-medium">إجازة أسبوعية لهذا الموظف</p>
            <div className="flex flex-wrap gap-2">
              {ARABIC_WEEKDAYS.map((d) => {
                const offs = s.weeklyOffDays || [];
                const on = offs.includes(d.weekday);
                return (
                  <button
                    key={d.weekday}
                    type="button"
                    className={`nubo-chip text-xs ${on ? "nubo-chip-on" : ""}`}
                    onClick={() =>
                      updateStaff(s.id, {
                        weeklyOffDays: on ? offs.filter((x) => x !== d.weekday) : [...offs, d.weekday],
                      })
                    }
                  >
                    {d.name}
                  </button>
                );
              })}
            </div>
            <label className="grid gap-1 text-sm">
              فاصل بعد كل موعد (دقيقة)
              <input
                type="number"
                min={0}
                max={180}
                className="rounded-2xl border border-line px-3 py-3"
                value={s.bufferMin ?? ""}
                placeholder={String(biz.bufferMin || 0)}
                onChange={(e) =>
                  updateStaff(s.id, { bufferMin: e.target.value === "" ? undefined : Number(e.target.value) })
                }
              />
            </label>
          </fieldset>
          <button
            type="button"
            className="justify-self-start text-sm text-terracotta"
            onClick={() => {
              setDraft((prev) => prev.filter((x) => x.id !== s.id));
              onDirty();
            }}
          >
            حذف الموظف
          </button>
        </article>
      ))}
    </div>
  );
}

function HolidaysSection({ biz, onChange, onDirty }: { biz: Business; onChange: Persist; onDirty: Dirty }) {
  const [date, setDate] = useState("");
  const [weekly, setWeekly] = useState(biz.weeklyOffDays || []);
  const [dates, setDates] = useState(biz.holidayDates || []);
  useEffect(() => setWeekly(biz.weeklyOffDays || []), [biz.weeklyOffDays]);
  useEffect(() => setDates(biz.holidayDates || []), [biz.holidayDates]);
  return (
    <div className="nubo-card grid gap-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">أيام العطلة وإغلاق الحجز</h1>
          <p className="mt-1 text-sm leading-7 text-muted">التقويم يتخطى العطل الأسبوعية والتواريخ المحددة، ويعرض للزبون إن اليوم عطلة.</p>
        </div>
        <button type="button" className="nubo-btn nubo-btn-primary" onClick={() => onChange({ ...biz, weeklyOffDays: weekly, holidayDates: dates })}>
          حفظ العطل
        </button>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">عطل أسبوعية ثابتة</legend>
        <div className="flex flex-wrap gap-2">
          {ARABIC_WEEKDAYS.map((d) => {
            const on = weekly.includes(d.weekday);
            return (
              <button
                key={d.weekday}
                type="button"
                className={`nubo-chip ${on ? "nubo-chip-on" : ""}`}
                onClick={() => {
                  setWeekly(on ? weekly.filter((x) => x !== d.weekday) : [...weekly, d.weekday]);
                  onDirty();
                }}
              >
                {d.name}
              </button>
            );
          })}
        </div>
      </fieldset>
      <div>
        <p className="mb-2 text-sm font-medium">تواريخ عطل محددة</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input className="rounded-2xl border border-line px-3 py-3" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <button
            type="button"
            className="nubo-btn nubo-btn-ghost"
            onClick={() => {
              if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || dates.includes(date)) return;
              if (Number.isNaN(new Date(`${date}T12:00:00`).getTime())) return;
              setDates([...dates, date].sort());
              setDate("");
              onDirty();
            }}
          >
            إضافة تاريخ
          </button>
        </div>
        <ul className="mt-3 grid gap-2">
          {dates.length === 0 && <li className="text-sm text-muted">ماكو تاريخ إغلاق بعد.</li>}
          {dates.map((iso) => (
            <li key={iso} className="flex items-center justify-between rounded-xl bg-sand px-3 py-2 text-sm">
              <span>
                {Number.isNaN(new Date(`${iso}T12:00:00`).getTime())
                  ? iso
                  : formatDateLatn(new Date(`${iso}T12:00:00`), { weekday: "long", day: "numeric", month: "long" }, AR_IQ_LATN)}
              </span>
              <button
                type="button"
                className="text-terracotta"
                onClick={() => {
                  setDates(dates.filter((x) => x !== iso));
                  onDirty();
                }}
              >
                حذف
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function HoursSection({ biz, onChange, onDirty }: { biz: Business; onChange: Persist; onDirty: Dirty }) {
  const [days, setDays] = useState(() => (biz.weekdayHours?.length ? biz.weekdayHours : weekdayHoursFromLegacy(biz.hours)));
  useEffect(() => setDays(biz.weekdayHours?.length ? biz.weekdayHours : weekdayHoursFromLegacy(biz.hours)), [biz.hours, biz.weekdayHours]);
  function setDay(weekday: number, patch: Partial<DaySchedule>) {
    setDays((prev) => prev.map((x) => (x.weekday === weekday ? { ...x, ...patch } : x)));
    onDirty();
  }
  return (
    <div className="nubo-card grid gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">ساعات العمل</h1>
          <p className="text-sm text-muted">الفترات بالحجز تُحسب من هالساعات، بعد استثناء العطل.</p>
        </div>
        <button type="button" className="nubo-btn nubo-btn-primary" onClick={() => onChange({ ...biz, weekdayHours: days })}>
          حفظ الساعات
        </button>
      </div>
      {ARABIC_WEEKDAYS.map((d) => {
        const row = days.find((x) => x.weekday === d.weekday) || { weekday: d.weekday, closed: false, open: "09:00", close: "22:00" };
        return (
          <div key={d.weekday} className="grid items-center gap-2 rounded-2xl bg-sand/70 p-3 sm:grid-cols-[7rem_auto_1fr_1fr]">
            <p className="font-semibold">{d.name}</p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={row.closed} onChange={(e) => setDay(d.weekday, { closed: e.target.checked })} />
              مغلق
            </label>
            <Time12Select disabled={row.closed} value={row.open} onChange={(open) => setDay(d.weekday, { open })} />
            <Time12Select disabled={row.closed} value={row.close} onChange={(close) => setDay(d.weekday, { close })} />
          </div>
        );
      })}
    </div>
  );
}

function ServicesSection({ biz, onChange, onDirty }: { biz: Business; onChange: Persist; onDirty: Dirty }) {
  const [draft, setDraft] = useState(() => sortedServices(withServiceDefaults(biz.services)));
  useEffect(() => setDraft(sortedServices(withServiceDefaults(biz.services))), [biz.services]);

  function commit(next: Service[]) {
    const indexed = reindexServices(next);
    setDraft(indexed);
    onDirty();
  }

  function update(id: string, patch: Partial<Service>) {
    let next = draft.map((s) => (s.id === id ? { ...s, ...patch } : s));
    if ("popular" in patch) next = sortedServices(next);
    commit(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">الخدمات</h1>
          <p className="mt-1 max-w-xl text-sm leading-7 text-muted">
            علّم الخدمة بالأكثر طلباً حتى تطلع أول القائمة وعلى الزبون. الأسهم ترتّب الأولوية، وسعر العرض يظهر مع شطب السعر القديم.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="nubo-btn nubo-btn-ghost" onClick={() => onChange({ ...biz, services: draft })}>
            حفظ الخدمات
          </button>
          <button
            type="button"
            className="nubo-btn nubo-btn-primary"
            onClick={() =>
              commit(
                [
                  ...draft,
                  {
                    id: `sv-${Date.now()}`,
                    name: "خدمة جديدة",
                    durationMin: 30,
                    priceIqd: 10000,
                    sortOrder: draft.length,
                  },
                ],
              )
            }
          >
            إضافة خدمة
          </button>
        </div>
      </div>
      {draft.map((s, index) => {
        const popularCount = draft.filter((x) => x.popular).length;
        const canUp = s.popular ? index > 0 : index > popularCount;
        const canDown = s.popular ? index < popularCount - 1 : index < draft.length - 1;
        return (
        <article key={s.id} className="nubo-card grid gap-3 p-5 md:grid-cols-3">
          <div className="flex flex-wrap items-center justify-between gap-2 md:col-span-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted">الترتيب {index + 1}</span>
              <ServiceTags s={s} />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="nubo-btn nubo-btn-ghost text-sm"
                disabled={!canUp}
                onClick={() => commit(moveService(draft, s.id, -1))}
              >
                أعلى
              </button>
              <button
                type="button"
                className="nubo-btn nubo-btn-ghost text-sm"
                disabled={!canDown}
                onClick={() => commit(moveService(draft, s.id, 1))}
              >
                أسفل
              </button>
            </div>
          </div>
          <label className="grid gap-1 text-sm md:col-span-3">
            اسم الخدمة
            <input className="rounded-2xl border border-line px-3 py-3" value={s.name} onChange={(e) => update(s.id, { name: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            المدة (دقيقة)
            <input
              type="number"
              min={10}
              className="rounded-2xl border border-line px-3 py-3"
              value={s.durationMin}
              onChange={(e) => update(s.id, { durationMin: Number(e.target.value) })}
            />
          </label>
          <label className="grid gap-1 text-sm">
            السعر (د.ع)
            <input
              type="number"
              min={0}
              className="rounded-2xl border border-line px-3 py-3"
              value={s.priceIqd}
              onChange={(e) => update(s.id, { priceIqd: Number(e.target.value) })}
            />
          </label>
          <label className="grid gap-1 text-sm">
            سعر العرض (د.ع)
            <input
              type="number"
              min={0}
              className="rounded-2xl border border-line px-3 py-3"
              placeholder="بدون عرض"
              value={s.offerPriceIqd ?? ""}
              onChange={(e) =>
                update(s.id, { offerPriceIqd: e.target.value === "" ? undefined : Number(e.target.value) })
              }
            />
          </label>
          <label className="grid gap-1 text-sm">
            عدد الجلسات
            <input
              type="number"
              min={1}
              max={24}
              className="rounded-2xl border border-line px-3 py-3"
              placeholder="1"
              value={s.sessionCount ?? ""}
              onChange={(e) =>
                update(s.id, { sessionCount: e.target.value === "" ? undefined : Number(e.target.value) })
              }
            />
          </label>
          <label className="grid gap-1 text-sm">
            الفاصل بين الجلسات (يوم)
            <input
              type="number"
              min={1}
              max={90}
              className="rounded-2xl border border-line px-3 py-3"
              placeholder="7"
              value={s.intervalDays ?? ""}
              onChange={(e) =>
                update(s.id, { intervalDays: e.target.value === "" ? undefined : Number(e.target.value) })
              }
            />
          </label>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={Boolean(s.popular)}
              onChange={(e) => update(s.id, { popular: e.target.checked })}
            />
            الأكثر طلباً — تظهر أولاً وعلى الخدمة علامة
          </label>
          <div className="flex items-end justify-between gap-2">
            <ServicePrice s={s} className="text-sm" />
            <button
              type="button"
              className="text-sm text-terracotta"
              onClick={() => commit(draft.filter((x) => x.id !== s.id))}
            >
              حذف
            </button>
          </div>
        </article>
        );
      })}
    </div>
  );
}

function SettingsSection({ biz, onChange, onDirty }: { biz: Business; onChange: Persist; onDirty: Dirty }) {
  const plan = planOf(biz);
  const [draft, setDraft] = useState({
    whatsappLink: biz.whatsappLink || "",
    ownerNotifyPhone: biz.ownerNotifyPhone || "",
    approvalMode: biz.approvalMode,
    bookingIntakePaused: Boolean(biz.bookingIntakePaused),
    showStaffPicker: biz.showStaffPicker !== false,
    reminderEnabled: biz.reminderEnabled !== false,
    staffWhatsAppEnabled: biz.staffWhatsAppEnabled !== false,
    notifyChannel: resolveNotifyChannel(biz),
    bufferMin: biz.bufferMin || 0,
  });
  useEffect(() => {
    setDraft({
      whatsappLink: biz.whatsappLink || "",
      ownerNotifyPhone: biz.ownerNotifyPhone || "",
      approvalMode: biz.approvalMode,
      bookingIntakePaused: Boolean(biz.bookingIntakePaused),
      showStaffPicker: biz.showStaffPicker !== false,
      reminderEnabled: biz.reminderEnabled !== false,
      staffWhatsAppEnabled: biz.staffWhatsAppEnabled !== false,
      notifyChannel: resolveNotifyChannel(biz),
      bufferMin: biz.bufferMin || 0,
    });
  }, [biz]);
  function edit<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    onDirty();
  }
  return (
    <form
      className="nubo-card grid gap-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        onChange({
          ...biz,
          whatsappLink: draft.whatsappLink,
          ownerNotifyPhone: draft.ownerNotifyPhone.trim(),
          approvalMode: draft.approvalMode,
          bookingIntakePaused: draft.bookingIntakePaused,
          showStaffPicker: draft.showStaffPicker,
          reminderEnabled: draft.reminderEnabled,
          staffWhatsAppEnabled: draft.staffWhatsAppEnabled,
          notifyChannel: draft.notifyChannel,
          bufferMin: draft.bufferMin,
        });
      }}
    >
      <h1 className="text-2xl font-bold">الحجز والإشعارات</h1>
      <DirectBookingLink slug={biz.slug} />
      <div className="rounded-2xl bg-sand px-4 py-3 text-sm leading-7 text-muted">
        {draft.notifyChannel === "meta"
          ? "الإشعارات تطلع من نظام إشعارات المنصة. الرصيد من صفحة الخطة."
          : "الإشعارات تطلع من واتسابك عبر تطبيق أندرويد على جهازك، مو من سيرفر موعدكم."}{" "}
        <Link href="/business/manage/whatsapp" className="font-semibold text-palm">
          قسم واتساب
        </Link>
      </div>
      {plan.channel === "both" && (
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">قناة الإشعار</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="notify-channel" checked={draft.notifyChannel === "owner"} onChange={() => edit("notifyChannel", "owner")} />
            واتساب رقمي — أربط حسابي وأرسل من رقمي
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="notify-channel" checked={draft.notifyChannel === "meta"} onChange={() => edit("notifyChannel", "meta")} />
            نظام إشعارات المنصة — مجاني على هالخطة
          </label>
        </fieldset>
      )}
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">موافقة المواعيد</legend>
        {(["AUTO", "MANUAL"] as const).map((mode) => (
          <label key={mode} className="flex items-center gap-2 text-sm">
            <input type="radio" name="approval" checked={draft.approvalMode === mode} onChange={() => edit("approvalMode", mode)} />
            {mode === "AUTO" ? "تلقائي — الموعد يثبت فوراً" : "يدوي — يبقى معلّق إلى أن توافق"}
          </label>
        ))}
      </fieldset>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={draft.bookingIntakePaused} onChange={(e) => edit("bookingIntakePaused", e.target.checked)} />
        إيقاف استقبال الحجوزات على المشروع كله
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={draft.showStaffPicker} onChange={(e) => edit("showStaffPicker", e.target.checked)} />
        إظهار اختيار الموظف للزبون
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={draft.reminderEnabled} onChange={(e) => edit("reminderEnabled", e.target.checked)} />
        تذكير واتساب قبل الموعد بـ 24 ساعة وساعة
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={draft.staffWhatsAppEnabled} onChange={(e) => edit("staffWhatsAppEnabled", e.target.checked)} />
        إرسال إشعار واتساب للموظف عند حجز جديد
      </label>
      <label className="grid gap-1 text-sm">
        فاصل بعد كل موعد (دقيقة)
        <input
          type="number"
          min={0}
          max={180}
          className="rounded-2xl border border-line px-3 py-3"
          value={draft.bufferMin}
          onChange={(e) => edit("bufferMin", Number(e.target.value) || 0)}
        />
        <span className="text-xs leading-6 text-muted">وقت تنظيف أو تحضير بين زبون وزبون. الموظف يقدر يحط فاصل أطول لحاله.</span>
      </label>
      <label className="grid gap-1 text-sm">
        رقم إشعارات المدير
        <input
          name="owner-notify-phone"
          className="rounded-2xl border border-line px-3 py-3"
          dir="ltr"
          value={draft.ownerNotifyPhone}
          onChange={(e) => edit("ownerNotifyPhone", e.target.value)}
          placeholder={biz.phone || "07xxxxxxxxx"}
          inputMode="tel"
        />
        <span className="text-xs leading-6 text-muted">
          اختياري. إشعار الحجز الجديد يروح لهذا الرقم مع رابط يفتح صفحة التقويم. إذا فاضي، نستخدم رقم المشروع. إذا رقم واتساب
          المربوط هو نفس رقم المشروع وواتساب رفض الرسالة لنفسك، حط رقم ثاني هنا. الموظف يستلم تنبيه لحاله إذا حطيت رقمه بصفحة الموظفين.
        </span>
      </label>
      <label className="grid gap-1 text-sm">
        رابط واتساب المشروع
        <input className="rounded-2xl border border-line px-3 py-3" dir="ltr" value={draft.whatsappLink} onChange={(e) => edit("whatsappLink", e.target.value)} />
      </label>
      <button className="nubo-btn nubo-btn-primary justify-self-start">حفظ الضبط</button>
    </form>
  );
}

function BookingsSection({ slug }: { slug: string }) {
  const [rows, setRows] = useState<BookingRecord[]>([]);
  useEffect(() => {
    setRows(bookingsForBusiness(slug));
    void fetchBusinessBookings(slug).then(setRows);
  }, [slug]);
  const list = useMemo(() => rows, [rows]);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">مواعيد المشروع</h1>
        <Link href="/business/manage/calendar" className="nubo-btn nubo-btn-primary text-sm">
          فتح التقويم
        </Link>
      </div>
      {list.length === 0 ? (
        <p className="nubo-card p-5 text-sm text-muted">ماكو مواعيد محفوظة بهالجهاز بعد.</p>
      ) : (
        list.map((b) => (
          <article key={b.id} className="nubo-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold">{b.customerName}</p>
              <span className={`rounded-full px-3 py-1 text-xs ${b.status === "pending" ? "bg-gold-soft text-palm" : "bg-sand"}`}>
                {statusLabelAr(b.status)}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">
              {b.serviceName} · {b.staffName} · {formatAppointmentWhen(b.date, b.time)}
            </p>
            {b.customerPhone && (
              <p className="mt-1 text-xs text-muted" dir="ltr">
                {b.customerPhone}
              </p>
            )}
            {b.reminderSentAt && <p className="mt-1 text-xs text-palm">انرسل تذكير واتساب</p>}
            {(b.status === "pending" || b.status === "confirmed") && (
              <div className="mt-3 flex flex-wrap gap-2">
                {b.status === "pending" && (
                  <button
                    type="button"
                    className="nubo-btn nubo-btn-primary text-sm"
                    onClick={() => {
                      updateBooking(b.id, { status: "confirmed" }, calendarActor("owner"));
                      setRows((prev) => prev.map((x) => (x.id === b.id ? { ...x, status: "confirmed" } : x)));
                    }}
                  >
                    تأكيد
                  </button>
                )}
                <button
                  type="button"
                  className="nubo-btn nubo-btn-ghost text-sm text-terracotta"
                  onClick={() => {
                    updateBooking(b.id, { status: "cancelled" }, calendarActor("owner"));
                    setRows((prev) => prev.map((x) => (x.id === b.id ? { ...x, status: "cancelled" } : x)));
                  }}
                >
                  إلغاء
                </button>
              </div>
            )}
          </article>
        ))
      )}
    </div>
  );
}

function CustomersSection({ slug }: { slug: string }) {
  const [rows, setRows] = useState<CustomerProfile[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");

  useEffect(() => {
    void fetch(`/api/customers?slug=${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { customers?: CustomerProfile[] }) => {
        const list = data.customers || [];
        setRows(list);
        setNotes(Object.fromEntries(list.map((c) => [c.phone, c.notes || ""])));
      })
      .catch(() => setRows([]));
  }, [slug]);

  const visible = rows.filter((c) => {
    if (!q.trim()) return true;
    return `${c.name} ${c.phone} ${c.notes}`.includes(q.trim());
  });

  async function saveNotes(phone: string, name: string) {
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, phone, name, notes: notes[phone] || "" }),
    });
    const data = (await res.json()) as { customer?: CustomerProfile };
    if (data.customer) {
      setRows((prev) => prev.map((c) => (c.phone === phone ? data.customer! : c)));
      showToast("انحفظت ملاحظة الزبون");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">زبائن المشروع</h1>
          <p className="text-sm text-muted">كل رقم يحجز ينحفظ هنا. ملاحظات، عدد زيارات، وإعادة حجز من الرابط.</p>
        </div>
        <input
          className="rounded-2xl border border-line px-3 py-2 text-sm"
          placeholder="بحث بالاسم أو الرقم"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {visible.length === 0 ? (
        <p className="nubo-card p-5 text-sm text-muted">ماكو زبائن محفوظين بعد. أول حجز يضيف الرقم تلقائياً.</p>
      ) : (
        visible.map((c) => (
          <article key={c.phone} className="nubo-card grid gap-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold">{c.name}</p>
                <p className="text-xs text-muted" dir="ltr">
                  {c.phone}
                </p>
              </div>
              <span className="nubo-chip text-xs">{c.visitCount || 1} زيارة</span>
            </div>
            <label className="grid gap-1 text-sm">
              ملاحظات
              <textarea
                className="min-h-16 rounded-2xl border border-line px-3 py-2"
                value={notes[c.phone] || ""}
                onChange={(e) => setNotes((prev) => ({ ...prev, [c.phone]: e.target.value }))}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="nubo-btn nubo-btn-ghost text-sm" onClick={() => void saveNotes(c.phone, c.name)}>
                حفظ الملاحظة
              </button>
              <Link href={`/book/${slug}`} className="nubo-btn nubo-btn-primary text-sm">
                إعادة حجز
              </Link>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
