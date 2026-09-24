"use client";

import { useEffect, useState } from "react";
import { SalonCard } from "@/components/SalonCard";
import { getFavs } from "@/lib/store";
import type { Business } from "@/lib/types";
import Link from "next/link";

export default function FavoritesPage() {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<Business[]>([]);
  useEffect(() => {
    setSlugs(getFavs());
    void fetch("/api/business/list", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { businesses?: Business[] }) => setCatalog(data.businesses || []))
      .catch(() => setCatalog([]));
  }, []);
  const list = catalog.filter((b) => slugs.includes(b.slug));
  if (slugs.length === 0) {
    return (
      <div className="nubo-card nubo-empty">
        <p className="font-bold">المفضلة فاضية</p>
        <Link href="/salons" className="nubo-btn nubo-btn-primary mt-4">
          استكشف الأعمال
        </Link>
      </div>
    );
  }
  if (list.length === 0) {
    return <p className="text-sm text-muted">نجيب المفضلة…</p>;
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {list.map((b) => (
        <SalonCard key={b.slug} b={b} />
      ))}
    </div>
  );
}
