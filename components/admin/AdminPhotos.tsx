"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageField, ProjectGalleryField } from "@/components/owner/ImageField";
import { adminGet } from "@/components/admin/admin-api";
import type { AdminBusinessRow } from "@/lib/admin-view";
import { showToast } from "@/lib/toast";

export function AdminPhotos({ embedded = false }: { embedded?: boolean }) {
  const [rows, setRows] = useState<AdminBusinessRow[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void adminGet<{ businesses: AdminBusinessRow[] }>("/api/admin/businesses")
      .then((data) => setRows(data.businesses || []))
      .catch((err: unknown) => {
        showToast(err instanceof Error ? err.message : "فشل تحميل الصور.", "err");
      });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return rows;
    return rows.filter((b) => `${b.name} ${b.district} ${b.staff.map((s) => s.name).join(" ")}`.includes(q));
  }, [rows, query]);

  return (
    <div className="space-y-6">
      {!embedded && (
        <header className="nubo-card-ink p-6">
          <h1 className="text-3xl font-bold">صور المشاريع والموظفين</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
            ارفع أو احذف صورة الغلاف ومعرض المشروع وصور كل موظف.
          </p>
        </header>
      )}

      <label className="grid gap-1 text-sm">
        بحث عن مشروع أو موظف
        <input
          className="rounded-2xl border border-line px-3 py-3"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="مثلاً الرافدين أو حسن"
        />
      </label>

      {filtered.length === 0 && <p className="text-sm text-muted">ماكو مشاريع بهالبحث.</p>}

      <div className="grid gap-5">
        {filtered.map((b) => (
          <article key={b.slug} className="nubo-card grid gap-5 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{b.name}</h2>
                <p className="text-sm text-muted">
                  {b.district} · {b.staff.length} موظف
                </p>
              </div>
              <a href={`/salon/${b.slug}`} className="text-sm text-palm">
                عرض الصفحة العامة
              </a>
            </div>
            <ImageField
              label="صورة المشروع"
              value={b.photo || ""}
              onChange={() => undefined}
              slug={b.slug}
              actor="admin"
              kind="project"
              hint="أدمن الموقع يقدر يبدّل أو يحذف غلاف أي مشروع."
            />
            <ProjectGalleryField photos={b.galleryPhotos || []} onChange={() => undefined} slug={b.slug} actor="admin" />
            <div className="grid gap-4">
              <h3 className="font-bold">الموظفون</h3>
              {b.staff.map((s) => (
                <div key={s.id} className="nubo-select-card grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-xs text-muted">{s.role}</p>
                  </div>
                  <ImageField
                    label="صورة الموظف"
                    value={s.photo || ""}
                    onChange={() => undefined}
                    slug={b.slug}
                    actor="admin"
                    kind="staff"
                    staffId={s.id}
                    circle
                  />
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
