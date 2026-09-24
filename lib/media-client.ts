"use client";

import { applyMediaOverlay, applyMediaToList, type MediaOverlay } from "./media";
import { MEDIA_EVENT } from "./store-constants";
import type { Business } from "./types";

let cache: MediaOverlay | null = null;
let inflight: Promise<MediaOverlay> | null = null;

export async function fetchMediaOverlay(force = false): Promise<MediaOverlay> {
  if (!force && cache) return cache;
  if (!force && inflight) return inflight;
  inflight = fetch("/api/media", { cache: "no-store" })
    .then(async (res) => {
      const data = (await res.json()) as { overlay?: MediaOverlay };
      cache = data.overlay || {};
      return cache;
    })
    .catch(() => cache || {})
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function getCachedMediaOverlay(): MediaOverlay {
  return cache || {};
}

export function setCachedMediaOverlay(overlay: MediaOverlay) {
  cache = overlay;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(MEDIA_EVENT));
}

export function withMedia<T extends Business>(business: T, overlay?: MediaOverlay | null): T {
  return applyMediaOverlay(business, overlay || cache || {}) as T;
}

export function withMediaList(list: Business[], overlay?: MediaOverlay | null): Business[] {
  return applyMediaToList(list, overlay || cache || {});
}

export function subscribeMedia(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(MEDIA_EVENT, onChange);
  return () => window.removeEventListener(MEDIA_EVENT, onChange);
}
