"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useT } from "@/components/LocaleProvider";
import { CATEGORIES, CITIES } from "@/lib/data";
import { categoryLabel, cityLabel } from "@/lib/i18n";
import { suggestSearch, type SearchSuggestion } from "@/lib/search";
import type { Business } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

export function SearchBar({
  initialCity = "",
  initialCategory = "",
  initialQ = "",
  compact = false,
}: {
  initialCity?: string;
  initialCategory?: string;
  initialQ?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const t = useT();
  const listId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const [city, setCity] = useState(initialCity);
  const [category, setCategory] = useState(initialCategory);
  const [q, setQ] = useState(initialQ);
  const [catalog, setCatalog] = useState<Business[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let gone = false;
    fetch("/api/business/list")
      .then((r) => r.json())
      .then((data) => {
        if (!gone && Array.isArray(data?.businesses)) setCatalog(data.businesses);
      })
      .catch(() => undefined);
    return () => {
      gone = true;
    };
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const suggestions = useMemo(
    () => suggestSearch(catalog, { q, city, category, locale: t.locale }),
    [catalog, q, city, category, t.locale],
  );

  function go(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    let href = "/salons";
    if (category && city) href = `/c/${category}/${city}`;
    else if (category) href = `/c/${category}`;
    else if (city) href = `/salons/${city}`;
    const qs = params.toString();
    setOpen(false);
    router.push(qs ? `${href}?${qs}` : href);
  }

  function pick(item: SearchSuggestion) {
    setOpen(false);
    router.push(item.href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp") && suggestions.length) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % Math.max(suggestions.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + Math.max(suggestions.length, 1)) % Math.max(suggestions.length, 1));
    } else if (e.key === "Enter" && suggestions[active]) {
      e.preventDefault();
      pick(suggestions[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const kindLabel: Record<SearchSuggestion["kind"], string> = {
    place: t("search.kindPlace"),
    city: t("search.kindCity"),
    category: t("search.kindCategory"),
    service: t("search.kindService"),
  };

  return (
    <form onSubmit={go} className={`nubo-search ${compact ? "nubo-search--compact" : ""}`} role="search">
      <select
        className="nubo-search-field"
        name="city"
        autoComplete="off"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        aria-label={t("search.city")}
      >
        <option value="">{t("search.allCities")}</option>
        {CITIES.map((c) => (
          <option key={c.slug} value={c.slug}>
            {cityLabel(t.locale, c.slug)}
          </option>
        ))}
      </select>
      <select
        className="nubo-search-field"
        name="category"
        autoComplete="off"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        aria-label={t("search.category")}
      >
        <option value="">{t("search.allServices")}</option>
        {CATEGORIES.map((c) => (
          <option key={c.slug} value={c.slug}>
            {categoryLabel(t.locale, c.slug)}
          </option>
        ))}
      </select>
      <div className="nubo-search-combo" ref={boxRef}>
        <input
          className="nubo-search-field"
          name="q"
          type="search"
          inputMode="search"
          autoComplete="off"
          spellCheck={false}
          placeholder={t("search.placeholder")}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => q.trim() && setOpen(true)}
          onKeyDown={onKeyDown}
          aria-label={t("search.q")}
          aria-autocomplete="list"
          aria-expanded={open && q.trim().length > 0}
          aria-controls={listId}
          role="combobox"
        />
        {q ? (
          <button
            type="button"
            className="nubo-search-clear"
            aria-label={t("search.clear")}
            onClick={() => {
              setQ("");
              setOpen(false);
            }}
          >
            <Icon name="close" className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
        {open && q.trim() ? (
          <ul id={listId} role="listbox" className="nubo-search-list" aria-label={t("search.suggestions")}>
            {suggestions.length === 0 ? (
              <li className="nubo-search-empty">{t("search.noHits")}</li>
            ) : (
              suggestions.map((item, i) => (
                <li key={item.id} role="option" aria-selected={i === active}>
                  <Link
                    href={item.href}
                    className={`nubo-search-hit ${i === active ? "is-active" : ""}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => setOpen(false)}
                  >
                    <span className="nubo-search-kind">{kindLabel[item.kind]}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{item.title}</span>
                      <span className="nubo-search-hint">{item.hint}</span>
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
      <button type="submit" className="nubo-btn nubo-btn-primary min-h-12 px-6">
        <Icon name="search" className="h-4 w-4" aria-hidden />
        {t("search.go")}
      </button>
    </form>
  );
}
