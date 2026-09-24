"use client";

import { useEffect, useState } from "react";
import { useT } from "@/components/LocaleProvider";
import { isManagerAuthed, loginManager } from "@/lib/store";

export function ManagerGate({ children }: { children: React.ReactNode }) {
  const t = useT();
  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setOk(isManagerAuthed());
    setReady(true);
  }, []);

  if (!ready) return <p className="text-muted">{t("owner.boot")}</p>;

  if (!ok) {
    return (
      <form
        className="nubo-glass mx-auto grid max-w-md gap-3 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (loginManager(pin)) {
            setOk(true);
            setError("");
          } else {
            setError(t("owner.pinErr"));
          }
        }}
      >
        <p className="text-sm text-gold">{t("owner.role")}</p>
        <h1 className="text-2xl font-bold">{t("owner.pinTitle")}</h1>
        <p className="text-sm leading-7 text-muted">{t("owner.pinLead")}</p>
        <label className="grid gap-1 text-sm">
          {t("owner.pinLabel")}
          <input
            className="rounded-2xl border border-line px-3 py-3"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="1234"
            inputMode="numeric"
            dir="ltr"
          />
        </label>
        <p className="text-xs text-muted">{t("owner.pinHint")}</p>
        {error && <p className="text-sm text-terracotta">{error}</p>}
        <button className="nubo-btn nubo-btn-primary">{t("owner.enter")}</button>
      </form>
    );
  }

  return <>{children}</>;
}
