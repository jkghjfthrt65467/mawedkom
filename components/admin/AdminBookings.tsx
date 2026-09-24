"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminGet, adminHeaders, adminSend } from "@/components/admin/admin-api";
import { formatNumber } from "@/lib/latin-digits";
import { showToast } from "@/lib/toast";
import type { BookingRecord, BookingStatus, WaitlistEntry } from "@/lib/types";

const STATUSES: { id: "" | BookingStatus; label: string }[] = [
  { id: "", label: "كل الحالات" },
  { id: "confirmed", label: "مؤكد" },
  { id: "pending", label: "بانتظار التأكيد" },
  { id: "completed", label: "مكتمل" },
  { id: "cancelled", label: "ملغي" },
  { id: "no_show", label: "ما حضر" },
];

export function AdminBookings() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | BookingStatus>("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const [b, w] = await Promise.all([
      adminGet<{ bookings: BookingRecord[] }>("/api/admin/bookings"),
      adminGet<{ entries: WaitlistEntry[] }>("/api/admin/waitlist"),
    ]);
    setBookings(b.bookings || []);
    setWaitlist(w.entries || []);
  }, []);

  useEffect(() => {
    void load().catch((err: unknown) => {
      showToast(err instanceof Error ? err.message : "فشل تحميل الحجوزات.", "err");
    });
  }, [load]);

  const rows = useMemo(() => {
    const q = query.trim();
    return bookings.filter((b) => {
      if (status && b.status !== status) return false;
      if (!q) return true;
      return `${b.businessName} ${b.customerName} ${b.customerPhone} ${b.serviceName} ${b.staffName}`.includes(q);
    });
  }, [bookings, query, status]);

  async function setStatusOf(row: BookingRecord, next: BookingStatus) {
    setBusy(row.manageToken);
    try {
      await adminSend("/api/admin/bookings", "PATCH", { token: row.manageToken, status: next });
      showToast("تم تحديث الموعد.");
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ما تم التحديث.", "err");
    } finally {
      setBusy("");
    }
  }

  async function dropWait(id: string) {
    try {
      const res = await fetch(`/api/admin/waitlist?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: adminHeaders(),
      });
      if (!res.ok) throw new Error("ما تم الحذف.");
      showToast("انحذف من قائمة الانتظار.");
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ما تم الحذف.", "err");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid min-w-[16rem] flex-1 gap-1 text-sm">
          بحث بالحجز
          <input
            className="rounded-2xl border border-line px-3 py-3"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="الزبون أو المشروع أو الرقم"
          />
        </label>
        <label className="grid gap-1 text-sm">
          الحالة
          <select
            className="rounded-2xl border border-line px-3 py-3"
            value={status}
            onChange={(e) => setStatus(e.target.value as "" | BookingStatus)}
          >
            {STATUSES.map((s) => (
              <option key={s.id || "all"} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm text-muted">{formatNumber(rows.length)} موعد</p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">ماكو مواعيد بهالعرض.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <article key={row.id} className="nubo-card grid gap-2 p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="font-bold">
                  <span className="tabular-nums">{row.date} {row.time}</span> · {row.businessName}
                </p>
                <p className="text-sm text-muted">
                  {row.customerName}
                  {row.customerPhone ? ` · ` : ""}
                  {row.customerPhone && <span dir="ltr">{row.customerPhone}</span>}
                  {" · "}
                  {row.serviceName || "خدمة"}
                  {row.staffName ? ` · ${row.staffName}` : ""}
                </p>
                <p className="text-xs text-muted">{statusLabel(row.status)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {row.status === "pending" && (
                  <button
                    type="button"
                    className="nubo-btn nubo-btn-primary text-sm"
                    disabled={busy === row.manageToken}
                    onClick={() => void setStatusOf(row, "confirmed")}
                  >
                    تأكيد
                  </button>
                )}
                {row.status !== "completed" && row.status !== "cancelled" && (
                  <button
                    type="button"
                    className="nubo-btn nubo-btn-ghost text-sm"
                    disabled={busy === row.manageToken}
                    onClick={() => void setStatusOf(row, "completed")}
                  >
                    اكتمل
                  </button>
                )}
                {row.status !== "cancelled" && (
                  <button
                    type="button"
                    className="nubo-btn nubo-btn-ghost text-sm text-terracotta"
                    disabled={busy === row.manageToken}
                    onClick={() => void setStatusOf(row, "cancelled")}
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-bold">قائمة الانتظار</h2>
        {waitlist.length === 0 ? (
          <p className="text-sm text-muted">ماكو أحد بقائمة الانتظار.</p>
        ) : (
          waitlist.map((w) => (
            <article key={w.id} className="nubo-card flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="text-sm leading-7">
                <span className="tabular-nums">{w.date} {w.time}</span>
                {" · "}
                {w.customerName}
                {" · "}
                <span dir="ltr">{w.customerPhone}</span>
              </p>
              <button type="button" className="nubo-btn nubo-btn-ghost text-sm text-terracotta" onClick={() => void dropWait(w.id)}>
                حذف
              </button>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

function statusLabel(status: string) {
  return STATUSES.find((s) => s.id === status)?.label || status;
}
