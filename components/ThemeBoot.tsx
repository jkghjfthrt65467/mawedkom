"use client";

import { useEffect } from "react";

export function ThemeBoot() {
  useEffect(() => {
    const saved = window.localStorage.getItem("nubo-theme");
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);
  return null;
}
