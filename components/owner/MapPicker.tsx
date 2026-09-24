"use client";

import { useEffect, useRef, useState } from "react";
import { ClickableMap } from "@/components/owner/ClickableMap";
import { GoogleMapEmbed } from "@/components/maps/GoogleMapEmbed";
import { googleMapsViewUrl, parseGoogleMapsCoords } from "@/lib/maps";

type SuggestItem = {
  id: string;
  label: string;
  lat?: number;
  lng?: number;
  placeId?: string;
};

export function MapPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number, address?: string) => void;
}) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<SuggestItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const mapLink = googleMapsViewUrl(lat, lng);

  useEffect(() => {
    const query = q.trim();
    const pasted = parseGoogleMapsCoords(query);
    if (pasted) {
      onChange(pasted.lat, pasted.lng);
      setItems([]);
      setOpen(false);
      setErr("");
      return;
    }
    if (query.length < 2) {
      setItems([]);
      return;
    }
    const t = window.setTimeout(() => {
      void (async () => {
        setBusy(true);
        setErr("");
        try {
          const res = await fetch(`/api/maps/suggest?q=${encodeURIComponent(query)}`);
          const data = (await res.json()) as { items?: SuggestItem[] };
          setItems(data.items || []);
          setOpen(true);
          if ((data.items || []).length === 0) setErr("ماكو اقتراح بهالاسم. جرّب اسم أوضح أو اضغط على الخريطة.");
        } catch {
          setErr("البحث يحتاج إنترنت.");
        }
        setBusy(false);
      })();
    }, 320);
    return () => window.clearTimeout(t);
    // onChange is stable enough from parent; avoid retrigger loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    function hide(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", hide);
    return () => document.removeEventListener("mousedown", hide);
  }, []);

  async function applySuggestion(item: SuggestItem) {
    setOpen(false);
    setItems([]);
    setQ(item.label);
    setErr("");
    if (typeof item.lat === "number" && typeof item.lng === "number") {
      onChange(item.lat, item.lng, item.label);
      return;
    }
    if (item.placeId) {
      const res = await fetch(`/api/maps/place?id=${encodeURIComponent(item.placeId)}`);
      const data = (await res.json()) as { ok?: boolean; lat?: number; lng?: number; address?: string };
      if (data.ok && data.lat && data.lng) {
        onChange(data.lat, data.lng, data.address || item.label);
        return;
      }
    }
    setErr("ما قدرنا نحدد النقطة. اضغط على الخريطة.");
  }

  async function pickOnMap(nextLat: number, nextLng: number) {
    onChange(nextLat, nextLng);
    try {
      const res = await fetch(`/api/maps/reverse?lat=${nextLat}&lng=${nextLng}`);
      const data = (await res.json()) as { address?: string };
      if (data.address) {
        onChange(nextLat, nextLng, data.address);
        setQ(data.address);
      }
    } catch {
      /* pin already saved */
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setErr("المتصفح ما يدعم تحديد الموقع.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void pickOnMap(pos.coords.latitude, pos.coords.longitude);
      },
      () => setErr("ما قدرنا نقرأ موقعك. فعّل صلاحية الموقع."),
    );
  }

  return (
    <div className="grid gap-3">
      <p className="text-sm leading-7 text-muted">
        اكتب اسم المكان؛ اضغط الاقتراح وينضاف تلقائياً. أو اضغط على الخريطة حتى تتحدد النقطة.
      </p>
      <div ref={boxRef} className="relative">
        <input
          className="w-full rounded-2xl border border-line px-3 py-3 text-sm"
          placeholder="ابحث في الخريطة: كرادة، صالون، عيادة…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => items.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {busy && <p className="mt-1 text-xs text-muted">ندور بالاقتراحات…</p>}
        {open && items.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-2xl border border-line bg-surface shadow-lg">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2.5 text-right text-sm hover:bg-palm-soft"
                  onClick={() => void applySuggestion(item)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {err && <p className="text-sm text-terracotta">{err}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="nubo-btn nubo-btn-ghost text-sm" onClick={useMyLocation}>
          استخدم موقعي
        </button>
        <a className="nubo-btn nubo-btn-ghost text-sm" href={mapLink} target="_blank" rel="noreferrer">
          فتح في خرائط Google
        </a>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line">
        <ClickableMap lat={lat} lng={lng} onPick={(a, b) => void pickOnMap(a, b)} />
      </div>
      <div className="overflow-hidden rounded-2xl border border-line">
        <GoogleMapEmbed lat={lat} lng={lng} title="معاينة خرائط Google" className="h-44 w-full border-0" />
      </div>
    </div>
  );
}
