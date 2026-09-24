"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useT } from "@/components/LocaleProvider";
import { getBookings, getFavs, getUser } from "@/lib/store";

export default function AccountHome() {
  const t = useT();
  const [n, setN] = useState({ books: 0, favs: 0, name: "" });
  useEffect(() => {
    setN({
      books: getBookings().filter((b) => b.status !== "cancelled").length,
      favs: getFavs().length,
      name: getUser()?.name || "",
    });
  }, []);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("account.title")}</h1>
      <p className="text-muted">{t("account.lead")}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/account/appointments" className="nubo-card nubo-select-card p-5">
          <p className="text-3xl font-bold text-palm">{n.books}</p>
          <p className="text-sm">{t("account.active")}</p>
        </Link>
        <Link href="/account/favorites" className="nubo-card nubo-select-card p-5">
          <p className="text-3xl font-bold text-palm">{n.favs}</p>
          <p className="text-sm">{t("account.favPlaces")}</p>
        </Link>
        <Link href="/business/manage" className="nubo-card-ink p-5 sm:col-span-2">
          <p className="font-bold text-gold">{t("nav.manage")}</p>
          <p className="mt-1 text-sm text-ink/80">{t("account.manageHint")}</p>
        </Link>
      </div>
    </div>
  );
}
