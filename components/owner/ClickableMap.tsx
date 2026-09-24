"use client";

import { useEffect, useRef } from "react";

type LeafletNs = {
  map: (el: HTMLElement, opts?: object) => LeafletMap;
  tileLayer: (url: string, opts?: object) => { addTo: (map: LeafletMap) => void };
  marker: (latlng: [number, number], opts?: object) => LeafletMarker;
  divIcon: (opts: object) => object;
};

type LeafletMap = {
  setView: (latlng: [number, number], zoom?: number) => void;
  on: (ev: string, fn: (e: { latlng: { lat: number; lng: number } }) => void) => void;
  remove: () => void;
  invalidateSize: () => void;
};

type LeafletMarker = {
  addTo: (map: LeafletMap) => LeafletMarker;
  setLatLng: (latlng: [number, number]) => void;
  on: (ev: string, fn: () => void) => void;
  getLatLng: () => { lat: number; lng: number };
};

declare global {
  interface Window {
    L?: LeafletNs;
  }
}

function loadLeaflet(): Promise<LeafletNs> {
  if (window.L) return Promise.resolve(window.L);
  return new Promise((resolve, reject) => {
    const cssId = "nubo-leaflet-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    const scriptId = "nubo-leaflet-js";
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => (window.L ? resolve(window.L) : reject(new Error("leaflet"))));
      return;
    }
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => (window.L ? resolve(window.L) : reject(new Error("leaflet")));
    script.onerror = () => reject(new Error("leaflet"));
    document.body.appendChild(script);
  });
}

export function ClickableMap({
  lat,
  lng,
  onPick,
}: {
  lat: number;
  lng: number;
  onPick: (lat: number, lng: number) => void;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    let dead = false;
    void loadLeaflet().then((L) => {
      if (dead || !elRef.current || mapRef.current) return;
      const map = L.map(elRef.current, { zoomControl: true }).setView([lat, lng], 16) as unknown as LeafletMap;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:18px;height:18px;border-radius:999px;background:#ff7802;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      const marker = L.marker([lat, lng], { draggable: true, icon }).addTo(map);
      map.on("click", (e) => {
        marker.setLatLng([e.latlng.lat, e.latlng.lng]);
        onPickRef.current(e.latlng.lat, e.latlng.lng);
      });
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        onPickRef.current(p.lat, p.lng);
      });
      mapRef.current = map;
      markerRef.current = marker;
      window.setTimeout(() => map.invalidateSize(), 80);
    });
    return () => {
      dead = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // init once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.setView([lat, lng], 16);
  }, [lat, lng]);

  return <div ref={elRef} className="h-64 w-full" />;
}
