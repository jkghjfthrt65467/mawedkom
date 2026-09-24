"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { PortalHeader } from "@/components/PortalHeader";

function isPortalPath(path: string) {
  return path.startsWith("/business/manage") || path.startsWith("/staff") || path.startsWith("/account");
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const book = path.startsWith("/book/");
  const portal = isPortalPath(path);
  const calendarWide = path === "/business/manage/calendar" || path === "/staff";
  return (
    <>
      {book ? null : portal ? <PortalHeader /> : <Header />}
      <main
        className={
          book
            ? "min-h-screen"
            : calendarWide
              ? "mx-auto min-h-[70vh] max-w-[100rem] px-3 py-4 lg:px-5"
              : "mx-auto min-h-[70vh] max-w-6xl px-4 py-8"
        }
      >
        {children}
      </main>
    </>
  );
}
