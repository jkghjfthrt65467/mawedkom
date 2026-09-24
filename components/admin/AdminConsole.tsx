"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminBookings } from "@/components/admin/AdminBookings";
import { AdminBusinesses } from "@/components/admin/AdminBusinesses";
import { AdminPeople } from "@/components/admin/AdminPeople";
import { AdminPhotos } from "@/components/admin/AdminPhotos";
import { AdminWhatsApp } from "@/components/admin/AdminWhatsApp";
import { adminGet } from "@/components/admin/admin-api";
import { formatNumber } from "@/lib/latin-digits";
import { logoutAdmin } from "@/lib/store";
import type { AdminBusinessRow } from "@/lib/admin-view";
import type { BookingRecord } from "@/lib/types";

type Tab = "overview" | "businesses" | "bookings" | "people" | "whatsapp" | "photos";

type Overview = {
  storage: string;
  database: boolean;
  counts: {
    businesses: number;
    featured: number;
    paused: number;
    hidden: number;
    pendingPlans: number;
    expiredTrials: number;
    bookings: number;
    bookingsToday: number;
    bookingsPending: number;
    customers: number;
    waitlist: number;
    outboxPending: number;
  };
  pendingPlans: AdminBusinessRow[];
  flagged: AdminBusinessRow[];
  recentBookings: BookingRecord[];
};

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "نظرة عامة" },
  { id: "businesses", label: "المشاريع" },
  { id: "bookings", label: "الحجوزات" },
  { id: "people", label: "الزبائن" },
  { id: "whatsapp", label: "واتساب" },
  { id: "photos", label: "الصور" },
];

export function AdminConsole() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const data = await adminGet<Overview>("/api/admin/overview");
      setOverview(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ما قدرنا نحمّل اللوحة.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, tick]);

  function refresh() {
    setTick((n) => n + 1);
  }

  const c = overview?.counts;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">أدمن موعدكم</h1>
          <p className="mt-1 text-sm leading-7 text-muted">
            تحكم بالمشاريع والخطط والحجوزات والصور والإشعارات من مكان واحد.
            {overview ? ` التخزين: ${overview.database ? "قاعدة بيانات" : "ملفات"}` : ""}
          </p>
        </div>
        <button
          type="button"
          className="nubo-btn nubo-btn-ghost text-terracotta"
          onClick={() => {
            logoutAdmin();
            router.push("/");
          }}
        >
          خروج الأدمن
        </button>
      </header>

      <nav className="flex flex-wrap gap-2" aria-label="أقسام الأدمن">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nubo-btn text-sm ${tab === item.id ? "nubo-btn-primary" : "nubo-btn-ghost"}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
            {item.id === "overview" && c && c.pendingPlans > 0 ? ` (${formatNumber(c.pendingPlans)})` : ""}
            {item.id === "whatsapp" && c && c.outboxPending > 0 ? ` (${formatNumber(c.outboxPending)})` : ""}
          </button>
        ))}
      </nav>

      {error && <p className="text-sm text-terracotta">{error}</p>}

      {tab === "overview" && (
        <OverviewPanel data={overview} onOpen={setTab} onRefresh={refresh} />
      )}
      {tab === "businesses" && <AdminBusinesses onChanged={refresh} />}
      {tab === "bookings" && <AdminBookings />}
      {tab === "people" && <AdminPeople />}
      {tab === "whatsapp" && <AdminWhatsApp />}
      {tab === "photos" && <AdminPhotos embedded />}
    </div>
  );
}

function OverviewPanel({
  data,
  onOpen,
  onRefresh,
}: {
  data: Overview | null;
  onOpen: (tab: Tab) => void;
  onRefresh: () => void;
}) {
  if (!data) return <p className="text-sm text-muted">نجهّز أرقام الموقع…</p>;
  const { counts: c } = data;
  const stats: { n: number; label: string; tab?: Tab }[] = [
    { n: c.businesses, label: "مشروع", tab: "businesses" },
    { n: c.bookingsToday, label: "حجز اليوم", tab: "bookings" },
    { n: c.bookingsPending, label: "بانتظار التأكيد", tab: "bookings" },
    { n: c.pendingPlans, label: "طلب خطة", tab: "businesses" },
    { n: c.paused, label: "حجز متوقف" },
    { n: c.hidden, label: "مخفي عن القائمة" },
    { n: c.customers, label: "زبون محفوظ", tab: "people" },
    { n: c.outboxPending, label: "رسالة واتساب معلّقة", tab: "whatsapp" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-line md:grid-cols-4">
        {stats.map((s) => (
          <button
            key={s.label}
            type="button"
            className="border-b border-e border-line bg-surface p-4 text-start last:border-b-0 md:[&:nth-child(4n)]:border-e-0"
            onClick={() => s.tab && onOpen(s.tab)}
          >
            <p className="text-2xl font-bold tabular-nums">{formatNumber(s.n)}</p>
            <p className="mt-1 text-sm text-muted">{s.label}</p>
          </button>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">طلبات الخطط</h2>
          <button type="button" className="text-sm text-palm" onClick={onRefresh}>
            تحديث
          </button>
        </div>
        {data.pendingPlans.length === 0 ? (
          <p className="text-sm text-muted">ماكو طلب تفعيل بانتظارك.</p>
        ) : (
          <div className="space-y-2">
            {data.pendingPlans.map((row) => (
              <p key={row.slug} className="text-sm leading-7">
                <button type="button" className="font-bold text-palm" onClick={() => onOpen("businesses")}>
                  {row.name}
                </button>
                <span className="text-muted">
                  {" "}
                  · {row.planName} → {row.requestedPlanName}
                </span>
              </p>
            ))}
          </div>
        )}
      </section>

      {data.flagged.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">يحتاج انتباه</h2>
          <ul className="space-y-2 text-sm leading-7">
            {data.flagged.map((row) => (
              <li key={row.slug}>
                <span className="font-semibold">{row.name}</span>
                <span className="text-muted">
                  {row.hidden ? " · مخفي" : ""}
                  {row.bookingIntakePaused ? " · الحجز متوقف" : ""}
                  {row.trialExpired ? " · انتهت التجربة المجانية" : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-bold">آخر الحجوزات</h2>
        {data.recentBookings.length === 0 ? (
          <p className="text-sm text-muted">ماكو حجوزات محفوظة بعد.</p>
        ) : (
          <ul className="space-y-2 text-sm leading-7">
            {data.recentBookings.map((b) => (
              <li key={b.id}>
                <span className="tabular-nums">{b.date} {b.time}</span>
                <span className="text-muted"> · {b.businessName} · {b.customerName} · {statusAr(b.status)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function statusAr(status: string) {
  if (status === "pending") return "بانتظار التأكيد";
  if (status === "cancelled") return "ملغي";
  if (status === "completed") return "مكتمل";
  if (status === "no_show") return "ما حضر";
  return "مؤكد";
}
