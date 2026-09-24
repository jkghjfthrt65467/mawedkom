"use client";

import Link from "next/link";
import { useT } from "@/components/LocaleProvider";

export function Logo({
  compact = false,
  light = false,
  href = "/",
}: {
  compact?: boolean;
  light?: boolean;
  href?: string;
}) {
  const t = useT();
  return (
    <Link
      href={href}
      aria-label={compact ? t("brand.name") : undefined}
      className={`flex items-center gap-2.5 ${light ? "text-ivory" : "text-ink"}`}
    >
      <span className="relative grid h-10 w-10 place-items-center rounded-2xl bg-palm text-ivory shadow-[0_8px_20px_-12px_rgba(255,120,2,0.9)] ring-1 ring-gold/40">
        <span className="text-lg font-bold leading-none">م</span>
        <span className="absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full bg-ivory ring-1 ring-black/20" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-xl font-bold tracking-tight">{t("brand.name")}</span>
          <span className={`block text-[11px] ${light ? "text-ivory/70" : "text-muted"}`}>{t("brand.tagline")}</span>
        </span>
      )}
    </Link>
  );
}
