"use client";

import { useEffect, useState } from "react";
import type { ToastKind } from "@/lib/toast";

type Toast = { id: number; message: string; kind: ToastKind };

export function ToastHost() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    function onToast(e: Event) {
      const detail = (e as CustomEvent<{ message?: string; kind?: ToastKind }>).detail;
      if (!detail?.message) return;
      const id = Date.now() + Math.random();
      const message = detail.message;
      const kind = detail.kind || "ok";
      setItems((prev) => [...prev.slice(-2), { id, message, kind }]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, 5200);
    }
    window.addEventListener("nubo-toast", onToast);
    return () => window.removeEventListener("nubo-toast", onToast);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-20 left-4 right-4 z-50 mx-auto flex max-w-md flex-col gap-2 lg:bottom-4">
      {items.map((t) => (
        <p
          key={t.id}
          className={`nubo-toast pointer-events-auto nubo-glass px-4 py-3 text-sm ${
            t.kind === "ok" ? "text-ink" : "border-terracotta/40 text-terracotta"
          }`}
        >
          {t.message}
        </p>
      ))}
    </div>
  );
}
