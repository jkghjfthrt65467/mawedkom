"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useT } from "@/components/LocaleProvider";
import { getUser } from "@/lib/store";
import { Icon } from "@/components/ui/Icon";

export function BottomNav() {
  const path = usePathname();
  const t = useT();
  const [authed, setAuthed] = useState(false);
  const ITEMS = [
    { href: "/", label: t("nav.home"), icon: "home" as const, match: (p: string) => p === "/" },
    { href: "/salons", label: t("nav.book"), icon: "search" as const, match: (p: string) => p.startsWith("/salons") || p.startsWith("/c/") || p.startsWith("/salon/") },
    { href: "/account/appointments", label: t("nav.appointments"), icon: "calendar" as const, match: (p: string) => p.startsWith("/account/appointments") || p.startsWith("/book/") || p.startsWith("/m/") },
    { href: "/account", label: t("nav.account"), icon: "user" as const, match: (p: string) => p.startsWith("/account") && !p.startsWith("/account/appointments") },
  ];

  useEffect(() => {
    setAuthed(Boolean(getUser()));
  }, [path]);

  return (
    <nav
      className="nubo-glass fixed inset-x-0 bottom-0 z-40 border-t px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1 lg:hidden"
      aria-label={t("nav.mainNav")}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {ITEMS.map((item) => {
          const href = item.href.startsWith("/account") && !authed ? "/login" : item.href;
          const on = item.match(path);
          return (
            <li key={item.label}>
              <Link
                href={href}
                className={`flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${on ? "text-palm" : "text-muted"}`}
              >
                <Icon name={item.icon} className="h-5 w-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
