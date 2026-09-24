"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminGet, adminSend } from "@/components/admin/admin-api";
import { formatNumber } from "@/lib/latin-digits";
import { showToast } from "@/lib/toast";

type Row = {
  businessSlug: string;
  phone: string;
  name: string;
  notes: string;
  updatedAt: string;
  visitCount?: number;
};

export function AdminPeople() {
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const data = await adminGet<{ customers: Row[] }>("/api/admin/customers");
    setRows(data.customers || []);
    setNotes(Object.fromEntries((data.customers || []).map((c) => [`${c.businessSlug}:${c.phone}`, c.notes || ""])));
  }, []);

  useEffect(() => {
    void load().catch((err: unknown) => {
      showToast(err instanceof Error ? err.message : "فشل تحميل الزبائن.", "err");
    });
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return rows;
    return rows.filter((r) => `${r.name} ${r.phone} ${r.businessSlug} ${r.notes}`.includes(q));
  }, [query, rows]);

  async function save(row: Row) {
    const key = `${row.businessSlug}:${row.phone}`;
    setBusy(key);
    try {
      await adminSend("/api/admin/customers", "PATCH", {
        slug: row.businessSlug,
        phone: row.phone,
        name: row.name,
        notes: notes[key] || "",
      });
      showToast("تم حفظ الملاحظة.");
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ما تم الحفظ.", "err");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-4">
      <label className="grid gap-1 text-sm">
        بحث عن زبون
        <input
          className="rounded-2xl border border-line px-3 py-3"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="الاسم أو الرقم"
        />
      </label>
      <p className="text-sm text-muted">{formatNumber(filtered.length)} زبون</p>
      {filtered.length === 0 && <p className="text-sm text-muted">ماكو زبائن محفوظين بهالبحث.</p>}
      <div className="space-y-3">
        {filtered.map((row) => {
          const key = `${row.businessSlug}:${row.phone}`;
          return (
            <article key={key} className="nubo-card grid gap-3 p-4">
              <div>
                <p className="font-bold">{row.name}</p>
                <p className="text-sm text-muted" dir="ltr">
                  {row.phone}
                </p>
                <p className="text-xs text-muted">
                  {row.businessSlug} · زيارات {formatNumber(row.visitCount || 0)}
                </p>
              </div>
              <textarea
                className="min-h-20 rounded-2xl border border-line px-3 py-3 text-sm"
                value={notes[key] || ""}
                onChange={(e) => setNotes((cur) => ({ ...cur, [key]: e.target.value }))}
                placeholder="ملاحظة الدعم"
              />
              <button
                type="button"
                className="nubo-btn nubo-btn-primary justify-self-start text-sm"
                disabled={busy === key}
                onClick={() => void save(row)}
              >
                حفظ الملاحظة
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
