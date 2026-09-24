import type { Service } from "./types";

export function isOnOffer(s: Service): boolean {
  return typeof s.offerPriceIqd === "number" && s.offerPriceIqd > 0 && s.offerPriceIqd < s.priceIqd;
}

export function effectivePrice(s: Service): number {
  return isOnOffer(s) ? (s.offerPriceIqd as number) : s.priceIqd;
}

export function servicesForNames(catalog: Service[], names?: string[], fallback?: string): Service[] {
  const wanted = (names?.length ? names : fallback ? fallback.split(/\s*[+،,]\s*/) : [])
    .map((n) => n.trim())
    .filter(Boolean);
  if (!wanted.length) return [];
  return catalog.filter((s) => wanted.includes(s.name));
}

export function combinedDuration(services: Service[], fallback = 30): number {
  if (!services.length) return Math.max(5, Number(fallback) || 30);
  return services.reduce((n, s) => n + Math.max(5, Number(s.durationMin) || 0), 0) || fallback;
}

export function combinedPrice(services: Service[]): number {
  return services.reduce((n, s) => n + effectivePrice(s), 0);
}

export function sortedServices(services: Service[]): Service[] {
  return [...services].sort((a, b) => {
    const pa = a.popular ? 0 : 1;
    const pb = b.popular ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}

export function withServiceDefaults(services: Service[]): Service[] {
  return services.map((s, i) => ({
    ...s,
    popular: Boolean(s.popular),
    offerPriceIqd: typeof s.offerPriceIqd === "number" && s.offerPriceIqd > 0 ? s.offerPriceIqd : undefined,
    sortOrder: typeof s.sortOrder === "number" ? s.sortOrder : i,
    sessionCount: typeof s.sessionCount === "number" && s.sessionCount > 1 ? Math.min(24, Math.round(s.sessionCount)) : undefined,
    intervalDays: typeof s.intervalDays === "number" && s.intervalDays > 0 ? Math.round(s.intervalDays) : s.sessionCount && s.sessionCount > 1 ? 7 : undefined,
  }));
}

export function reindexServices(services: Service[]): Service[] {
  return services.map((s, i) => ({ ...s, sortOrder: i }));
}

export function moveService(services: Service[], id: string, dir: -1 | 1): Service[] {
  const list = [...services];
  const i = list.findIndex((s) => s.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return services;
  [list[i], list[j]] = [list[j], list[i]];
  return reindexServices(list);
}
