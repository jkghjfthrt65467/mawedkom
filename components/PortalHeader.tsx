"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LocaleToggle } from "./LocaleToggle";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { getStaffSession, getUser, isManagerAuthed } from "@/lib/store";

function homeHrefForRole(path: string) {
  if (path.startsWith("/business/manage")) return "/business/manage";
  if (path.startsWith("/staff")) return getStaffSession() ? "/staff" : "/";
  if (path.startsWith("/account")) return getUser() ? "/account" : "/";
  if (isManagerAuthed()) return "/business/manage";
  if (getStaffSession()) return "/staff";
  if (getUser()) return "/account";
  return "/";
}

export function PortalHeader() {
  const path = usePathname();
  const [homeHref, setHomeHref] = useState("/");

  useEffect(() => {
    setHomeHref(homeHrefForRole(path));
  }, [path]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas">
      <nav className="mx-auto flex max-w-[100rem] items-center gap-2 px-4 py-2.5 lg:px-5">
        <Logo compact href={homeHref} />
        <LocaleToggle />
        <ThemeToggle />
      </nav>
    </header>
  );
}
