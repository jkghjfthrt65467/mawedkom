"use client";

import { useEffect, useState } from "react";
import { useT } from "@/components/LocaleProvider";
import { Icon } from "@/components/ui/Icon";

function applyTheme(light: boolean) {
  document.documentElement.classList.toggle("dark", !light);
}

export function ThemeToggle() {
  const t = useT();
  const [light, setLight] = useState(true);

  useEffect(() => {
    const saved = window.localStorage.getItem("nubo-theme");
    const next = saved !== "dark";
    setLight(next);
    applyTheme(next);
  }, []);

  return (
    <button
      type="button"
      className="grid h-11 w-11 place-items-center rounded-full border border-line text-ink"
      aria-label={light ? t("theme.dark") : t("theme.light")}
      onClick={() => {
        const next = !light;
        setLight(next);
        window.localStorage.setItem("nubo-theme", next ? "light" : "dark");
        applyTheme(next);
      }}
    >
      <Icon name={light ? "moon" : "sun"} className="h-5 w-5" />
    </button>
  );
}
