"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useT } from "@/components/LocaleProvider";
import { getUser, logout } from "@/lib/store";

export function AccountChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const t = useT();
  const LINKS = [
    { href: "/account", label: t("account.overview") },
    { href: "/account/appointments", label: t("account.appointments") },
    { href: "/account/favorites", label: t("account.favorites") },
    { href: "/account/profile", label: t("account.profile") },
    { href: "/whatsapp", label: t("nav.whatsapp") },
    { href: "/business/manage", label: t("nav.manage") },
  ];
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    setName(u.name);
    setReady(true);
  }, [router, path]);

  if (!ready) return <p className="text-muted">{t("account.loading")}</p>;

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <aside className="nubo-glass h-fit p-4 md:sticky md:top-20">
        <p className="text-sm text-muted">{t("account.hi")}</p>
        <p className="font-bold">{name}</p>
        <nav className="mt-4 grid gap-1 text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nubo-nav-item ${path === l.href ? "nubo-nav-item-on" : "hover:bg-sand"}`}
            >
              {l.label}
            </Link>
          ))}
          <button
            type="button"
            className="mt-2 text-right text-terracotta"
            onClick={() => {
              logout();
              router.push("/");
            }}
          >
            {t("common.logout")}
          </button>
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}
