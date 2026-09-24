"use client";

export const BOOKING_LIVE_EVENT = "mawedkom-bookings";

export function announceBookingsChanged(slug: string) {
  if (typeof window === "undefined" || !slug) return;
  window.dispatchEvent(new CustomEvent(BOOKING_LIVE_EVENT, { detail: { slug } }));
  try {
    const ch = new BroadcastChannel(BOOKING_LIVE_EVENT);
    ch.postMessage({ slug });
    ch.close();
  } catch {
    /* BroadcastChannel may be unavailable */
  }
}

export function subscribeBookingsChanged(slug: string, onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onEvent = (e: Event) => {
    const detail = (e as CustomEvent<{ slug?: string }>).detail;
    if (!detail?.slug || detail.slug === slug) onChange();
  };
  window.addEventListener(BOOKING_LIVE_EVENT, onEvent);
  let ch: BroadcastChannel | null = null;
  try {
    ch = new BroadcastChannel(BOOKING_LIVE_EVENT);
    ch.onmessage = (e) => {
      const next = e.data as { slug?: string } | undefined;
      if (!next?.slug || next.slug === slug) onChange();
    };
  } catch {
    ch = null;
  }
  return () => {
    window.removeEventListener(BOOKING_LIVE_EVENT, onEvent);
    ch?.close();
  };
}
