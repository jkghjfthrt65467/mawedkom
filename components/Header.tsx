"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { LocaleToggle } from "./LocaleToggle";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "./Logo";
import { useT } from "@/components/LocaleProvider";
import { getUser } from "@/lib/store";

export function Header() {
  const path = usePathname();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [user, setUserState] = useState<string | null>(null);
  const NAV = [
    { href: "/salons", label: t("nav.book") },
    { href: "/business", label: t("nav.business") },
    { href: "/pricing", label: t("nav.pricing") },
  ];

  useEffect(() => {
    setUserState(getUser()?.name ?? null);
    setOpen(false);
  }, [path]);

  function active(href: string) {
    if (href === "/business") return path === "/business" || path.startsWith("/business/signup");
    return path === href || path.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Logo />
        <ul className="hidden items-center gap-6 text-sm font-medium text-ink/80 lg:flex">
          {NAV.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={active(l.href) ? "text-palm" : "hover:text-palm"}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="hidden items-center gap-2 lg:flex">
          <LocaleToggle />
          <ThemeToggle />
          {user ? (
            <Link href="/account" className="nubo-btn nubo-btn-ghost text-sm">
              {t("nav.account")} · {user.split(" ")[0]}
            </Link>
          ) : (
            <>
              <Link href="/login" className="nubo-btn nubo-btn-ghost text-sm">
                {t("nav.login")}
              </Link>
              <Link href="/register" className="nubo-btn nubo-btn-primary text-sm">
                {t("nav.register")}
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <LocaleToggle />
          <ThemeToggle />
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full border border-line"
            aria-label={t("nav.menu")}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "close" : "menu"} className="h-5 w-5" />
          </button>
        </div>
      </nav>
      {open && (
        <div className="nubo-menu-panel nubo-glass border-t border-line px-4 py-4 lg:hidden">
          <ul className="grid gap-1 text-sm font-medium">
            {NAV.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="nubo-nav-item">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={user ? "/account" : "/login"} className="nubo-nav-item">
                {user ? t("nav.account") : t("nav.login")}
              </Link>
            </li>
            <li>
              <Link href="/register" className="nubo-btn nubo-btn-primary w-full">
                {t("nav.register")}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
