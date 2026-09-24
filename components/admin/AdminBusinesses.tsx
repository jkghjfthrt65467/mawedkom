"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminGet, adminHeaders, adminSend } from "@/components/admin/admin-api";
import type { AdminBusinessRow } from "@/lib/admin-view";
import { formatNumber } from "@/lib/latin-digits";
import { formatUsd, PLANS } from "@/lib/plans";
import { showToast } from "@/lib/toast";

type Payload = {
  businesses: AdminBusinessRow[];
  cities: { slug: string; name: string }[];
  categories: { slug: string; name: string }[];
};

type Filter = "all" | "pending" | "paused" | "hidden" | "featured";

export function AdminBusinesses({ onChanged }: { onChanged?: () => void }) {
  const [data, setData] = useState<Payload | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const next = await adminGet<Payload>("/api/admin/businesses");
    setData(next);
  }, []);

  useEffect(() => {
    void load().catch((err: unknown) => {
      showToast(err instanceof Error ? err.message : "فشل تحميل المشاريع.", "err");
    });
  }, [load]);

  const rows = useMemo(() => {
    if (!data) return [];
    const q = query.trim();
    return data.businesses.filter((b) => {
      if (filter === "pending" && !b.pending) return false;
      if (filter === "paused" && !b.bookingIntakePaused) return false;
      if (filter === "hidden" && !b.hidden) return false;
      if (filter === "featured" && !b.featured) return false;
      if (!q) return true;
      return `${b.name} ${b.phone} ${b.slug} ${b.district}`.includes(q);
    });
  }, [data, filter, query]);

  async function patch(slug: string, body: Record<string, unknown>, okMsg: string) {
    setBusy(slug);
    try {
      await adminSend("/api/admin/businesses", "PATCH", { slug, ...body });
      showToast(okMsg);
      await load();
      onChanged?.();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ما تم الحفظ.", "err");
    } finally {
      setBusy("");
    }
  }

  async function remove(row: AdminBusinessRow) {
    if (!window.confirm(`تخفي أو تحذف ${row.name} من الموقع؟`)) return;
    setBusy(row.slug);
    try {
      const res = await fetch(`/api/admin/businesses?slug=${encodeURIComponent(row.slug)}`, {
        method: "DELETE",
        headers: adminHeaders(),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || "ما تم الحذف.");
      showToast(`تم إخراج ${row.name} من الموقع.`);
      await load();
      onChanged?.();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ما تم الحذف.", "err");
    } finally {
      setBusy("");
    }
  }

  if (!data) return <p className="text-sm text-muted">نحمّل المشاريع…</p>;

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "الكل" },
    { id: "pending", label: "طلبات الخطط" },
    { id: "paused", label: "متوقف" },
    { id: "hidden", label: "مخفي" },
    { id: "featured", label: "مختار" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="grid min-w-[16rem] flex-1 gap-1 text-sm">
          بحث عن مشروع
          <input
            className="rounded-2xl border border-line px-3 py-3"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="الاسم أو الرقم أو الحي"
          />
        </label>
        <p className="text-sm text-muted">{formatNumber(rows.length)} مشروع</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`nubo-btn text-sm ${filter === f.id ? "nubo-btn-primary" : "nubo-btn-ghost"}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {rows.length === 0 && <p className="text-sm text-muted">ماكو نتيجة بهالبحث.</p>}
      <div className="space-y-3">
        {rows.map((row) => (
          <BusinessCard
            key={row.slug}
            row={row}
            cities={data.cities}
            categories={data.categories}
            open={open === row.slug}
            busy={busy === row.slug}
            onToggle={() => setOpen((cur) => (cur === row.slug ? "" : row.slug))}
            onPatch={patch}
            onRemove={() => void remove(row)}
          />
        ))}
      </div>
    </div>
  );
}

function BusinessCard({
  row,
  cities,
  categories,
  open,
  busy,
  onToggle,
  onPatch,
  onRemove,
}: {
  row: AdminBusinessRow;
  cities: { slug: string; name: string }[];
  categories: { slug: string; name: string }[];
  open: boolean;
  busy: boolean;
  onToggle: () => void;
  onPatch: (slug: string, body: Record<string, unknown>, okMsg: string) => Promise<void>;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState(row);
  const [planId, setPlanId] = useState(row.requestedPlanId);
  const [wallet, setWallet] = useState("");

  useEffect(() => {
    setDraft(row);
    setPlanId(row.requestedPlanId);
  }, [row]);

  return (
    <article className="nubo-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold">{row.name}</p>
          <p className="text-sm text-muted">
            {row.planName}
            {row.pending ? ` → ${row.requestedPlanName}` : ""}
            {" · "}
            {formatNumber(row.staffCount)} موظف
            {" · "}
            {formatNumber(row.bookingsThisMonth)} حجز هذا الشهر
          </p>
          <p className="text-xs text-muted" dir="ltr">
            {row.phone}
          </p>
          <p className="mt-1 flex flex-wrap gap-1 text-xs">
            {row.featured && <span className="rounded-full bg-palm-soft px-2 py-0.5 text-palm">مختار</span>}
            {row.bookingIntakePaused && <span className="rounded-full bg-sand px-2 py-0.5">الحجز متوقف</span>}
            {row.hidden && <span className="rounded-full bg-sand px-2 py-0.5">مخفي</span>}
            {row.trialExpired && <span className="rounded-full bg-sand px-2 py-0.5 text-terracotta">التجربة انتهت</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {row.pending && (
            <button
              type="button"
              className="nubo-btn nubo-btn-primary text-sm"
              disabled={busy}
              onClick={() => void onPatch(row.slug, { planId: row.requestedPlanId }, `تم تفعيل ${row.requestedPlanName}`)}
            >
              تفعيل {row.requestedPlanName}
            </button>
          )}
          <button type="button" className="nubo-btn nubo-btn-ghost text-sm" onClick={onToggle}>
            {open ? "إغلاق التحكم" : "تحكم كامل"}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 grid gap-4 border-t border-line pt-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="اسم المشروع" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
            <Field label="هاتف" value={draft.phone} onChange={(v) => setDraft({ ...draft, phone: v })} ltr />
            <label className="grid gap-1 text-sm">
              المحافظة
              <select
                className="rounded-2xl border border-line px-3 py-3"
                value={draft.city}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
              >
                {cities.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              التصنيف
              <select
                className="rounded-2xl border border-line px-3 py-3"
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <Field label="الحي" value={draft.district} onChange={(v) => setDraft({ ...draft, district: v })} />
            <Field label="العنوان" value={draft.address} onChange={(v) => setDraft({ ...draft, address: v })} />
          </div>
          <label className="grid gap-1 text-sm">
            نبذة
            <textarea
              className="min-h-24 rounded-2xl border border-line px-3 py-3"
              value={draft.about}
              onChange={(e) => setDraft({ ...draft, about: e.target.value })}
            />
          </label>
          <button
            type="button"
            className="nubo-btn nubo-btn-primary justify-self-start text-sm"
            disabled={busy}
            onClick={() =>
              void onPatch(
                row.slug,
                {
                  name: draft.name,
                  phone: draft.phone,
                  city: draft.city,
                  district: draft.district,
                  address: draft.address,
                  category: draft.category,
                  about: draft.about,
                },
                "تم حفظ بيانات المشروع.",
              )
            }
          >
            حفظ البيانات
          </button>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm">
              الخطة
              <select
                className="rounded-2xl border border-line px-3 py-3"
                value={planId}
                onChange={(e) => setPlanId(e.target.value as AdminBusinessRow["planId"])}
              >
                {PLANS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {formatUsd(p.priceUsd)}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <button
                type="button"
                className="nubo-btn nubo-btn-primary text-sm"
                disabled={busy}
                onClick={() => void onPatch(row.slug, { planId }, `تم تفعيل ${PLANS.find((p) => p.id === planId)?.name || "الخطة"}`)}
              >
                تفعيل الخطة
              </button>
            </div>
            <label className="grid gap-1 text-sm">
              شحن رصيد الإشعارات ({formatUsd(row.walletUsd)})
              <input
                className="rounded-2xl border border-line px-3 py-3"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                placeholder="مثلاً 10"
                inputMode="decimal"
                dir="ltr"
              />
            </label>
            <div className="flex items-end gap-2">
              <button
                type="button"
                className="nubo-btn nubo-btn-ghost text-sm"
                disabled={busy}
                onClick={() => void onPatch(row.slug, { walletTopUp: 10 }, "تم شحن 10$.")}
              >
                +10$
              </button>
              <button
                type="button"
                className="nubo-btn nubo-btn-primary text-sm"
                disabled={busy || !wallet}
                onClick={() => void onPatch(row.slug, { walletTopUp: Number(wallet) }, "تم شحن الرصيد.")}
              >
                شحن
              </button>
            </div>
          </div>

          <div className="grid gap-2 text-sm">
            <Toggle
              label="مختار على الرئيسية"
              checked={row.featured}
              disabled={busy}
              onChange={(v) => void onPatch(row.slug, { featured: v }, v ? "صار مختار." : "انشال من المختارة.")}
            />
            <Toggle
              label="إيقاف استقبال الحجوزات"
              checked={row.bookingIntakePaused}
              disabled={busy}
              onChange={(v) => void onPatch(row.slug, { bookingIntakePaused: v }, v ? "توقف الحجز." : "الحجز مفتوح.")}
            />
            <Toggle
              label="إخفاء من قائمة الموقع"
              checked={row.hidden}
              disabled={busy}
              onChange={(v) => void onPatch(row.slug, { hidden: v }, v ? "اختفى من القائمة." : "رجع للقائمة.")}
            />
            <Toggle
              label="تأكيد يدوي للمواعيد"
              checked={row.approvalMode === "MANUAL"}
              disabled={busy}
              onChange={(v) => void onPatch(row.slug, { approvalMode: v ? "MANUAL" : "AUTO" }, "تم تغيير وضع التأكيد.")}
            />
            <Toggle
              label="إشعارات من نظام المنصة"
              checked={row.notifyChannel === "meta"}
              disabled={busy}
              onChange={(v) => void onPatch(row.slug, { notifyChannel: v ? "meta" : "owner" }, "تم تغيير قناة الإشعار.")}
            />
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <a href={`/salon/${row.slug}`} className="text-palm">
              الصفحة العامة
            </a>
            <a href={`/book/${row.slug}`} className="text-palm">
              رابط الحجز
            </a>
            <button type="button" className="text-terracotta" disabled={busy} onClick={onRemove}>
              إخراج من الموقع
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function Field({
  label,
  value,
  onChange,
  ltr,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  ltr?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <input
        className="rounded-2xl border border-line px-3 py-3"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir={ltr ? "ltr" : undefined}
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
