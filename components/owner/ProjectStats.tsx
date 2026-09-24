"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { statusLabelAr } from "@/lib/booking-message";
import { formatIqd } from "@/lib/data";
import { computeProjectStats, formatStatNumber, type PeriodKey, type ProjectStats as Stats } from "@/lib/project-stats";
import { fetchBusinessBookings } from "@/lib/store";
import type { BookingStatus, Business } from "@/lib/types";

const PERIODS: { id: PeriodKey; label: string; hint: string }[] = [
  { id: "today", label: "اليوم", hint: "بتوقيت بغداد" },
  { id: "week", label: "هذا الأسبوع", hint: "من السبت إلى الجمعة" },
  { id: "month", label: "هذا الشهر", hint: "شهر بغداد الحالي" },
  { id: "all", label: "كل الوقت", hint: "كل المواعيد المحفوظة" },
];

const STATUSES: BookingStatus[] = ["confirmed", "pending", "cancelled", "completed", "no_show"];

export function ProjectStats({ business }: { business: Business }) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchBusinessBookings(business.slug).then((rows) => {
      if (!alive) return;
      setStats(computeProjectStats(rows, business));
    });
    return () => {
      alive = false;
    };
  }, [business]);

  if (!stats) {
    return <p className="text-muted">نحسب إحصائيات المشروع…</p>;
  }

  const maxStatus = Math.max(1, ...STATUSES.map((s) => stats.byStatus[s]));
  const maxStaff = Math.max(1, ...stats.perStaff.map((s) => s.count));
  const maxService = Math.max(1, ...stats.perService.map((s) => s.count), 1);

  return (
    <div className="space-y-4">
      <header className="nubo-card-ink overflow-hidden p-6">
        <p className="text-sm text-gold">إحصائيات المشروع</p>
        <h1 className="mt-1 text-3xl font-bold">أرقام الحجوزات</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-ink/80">
          الأعداد من مواعيد المشروع المحفوظة، والإيراد تقديري من أسعار الخدمات. التوقيت {stats.timezone} · {stats.today}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PERIODS.map((p, i) => (
          <article key={p.id} className={`nubo-card p-4 ${i === 0 ? "border-palm/35 sm:col-span-2 lg:col-span-1" : ""}`}>
            <p className="text-xs text-muted">{p.label}</p>
            <p className="mt-1 text-3xl font-bold text-palm">{formatStatNumber(stats.periods[p.id].count)}</p>
            <p className="mt-1 text-sm text-muted">{formatIqd(stats.periods[p.id].revenueIqd)}</p>
            <p className="mt-2 text-[11px] text-muted">{p.hint}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <article className="nubo-card p-4">
          <p className="text-xs text-muted">قادمة</p>
          <p className="mt-1 text-3xl font-bold text-palm">{formatStatNumber(stats.upcoming)}</p>
          <p className="text-sm text-muted">مؤكدة أو معلّقة وما صارت بعد</p>
        </article>
        <article className="nubo-card p-4">
          <p className="text-xs text-muted">ماضية</p>
          <p className="mt-1 text-3xl font-bold">{formatStatNumber(stats.past)}</p>
          <p className="text-sm text-muted">تشمل المكتمل والملغى والغياب</p>
        </article>
      </div>

      <section className="nubo-card p-5">
        <h2 className="text-lg font-bold">حسب الحالة</h2>
        <div className="mt-4 grid gap-3">
          {STATUSES.map((status) => (
            <BarRow
              key={status}
              label={statusLabelAr(status)}
              value={stats.byStatus[status]}
              max={maxStatus}
            />
          ))}
        </div>
      </section>

      <section className="nubo-card p-5">
        <h2 className="text-lg font-bold">حسب الموظف</h2>
        <p className="mt-1 text-sm text-muted">عدد المواعيد وإيراد تقديري من سعر الخدمة.</p>
        <div className="mt-4 grid gap-3">
          {stats.perStaff.map((row) => (
            <BarRow
              key={row.id}
              label={row.name}
              value={row.count}
              max={maxStaff}
              extra={formatIqd(row.revenueIqd)}
            />
          ))}
        </div>
      </section>

      <section className="nubo-card p-5">
        <h2 className="text-lg font-bold">حسب الخدمة</h2>
        <div className="mt-4 grid gap-3">
          {stats.perService.length === 0 && <p className="text-sm text-muted">ماكو خدمات محجوزة بعد.</p>}
          {stats.perService.map((row) => (
            <BarRow
              key={row.id}
              label={row.name}
              value={row.count}
              max={maxService}
              extra={formatIqd(row.revenueIqd)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export function StatsSummaryCard({ business }: { business: Business }) {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    let alive = true;
    void fetchBusinessBookings(business.slug).then((rows) => {
      if (!alive) return;
      setStats(computeProjectStats(rows, business));
    });
    return () => {
      alive = false;
    };
  }, [business]);

  const today = stats?.periods.today.count ?? "—";
  const month = stats?.periods.month.count ?? "—";
  const revenue = useMemo(() => (stats ? formatIqd(stats.periods.month.revenueIqd) : "—"), [stats]);

  return (
    <article className="nubo-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gold">إحصائيات المشروع</p>
          <h2 className="mt-1 text-xl font-bold">أرقام الحجوزات</h2>
          <p className="mt-1 text-sm text-muted">اليوم والشهر والإيراد التقديري من أسعار الخدمات. توقيت بغداد.</p>
        </div>
        <Link href="/business/manage/stats" className="nubo-btn nubo-btn-primary text-sm">
          فتح الإحصائيات
        </Link>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="nubo-select-card px-4 py-3">
          <p className="text-2xl font-bold text-palm">{typeof today === "number" ? formatStatNumber(today) : today}</p>
          <p className="text-xs text-muted">مواعيد اليوم</p>
        </div>
        <div className="nubo-select-card px-4 py-3">
          <p className="text-2xl font-bold text-palm">{typeof month === "number" ? formatStatNumber(month) : month}</p>
          <p className="text-xs text-muted">هذا الشهر</p>
        </div>
        <div className="nubo-select-card px-4 py-3">
          <p className="text-2xl font-bold text-palm">{revenue}</p>
          <p className="text-xs text-muted">إيراد الشهر التقديري</p>
        </div>
      </div>
    </article>
  );
}

function BarRow({ label, value, max, extra }: { label: string; value: number; max: number; extra?: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted">
          {formatStatNumber(value)}
          {extra ? ` · ${extra}` : ""}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-sand">
        <div className="h-full rounded-full bg-palm" style={{ width: `${value === 0 ? 0 : Math.max(6, pct)}%` }} />
      </div>
    </div>
  );
}
