export type MapSuggestItem = {
  id: string;
  label: string;
  lat?: number;
  lng?: number;
  placeId?: string;
};

export function googleMapsKey() {
  return process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
}

const UA = "Mawedkom/1.0 (Iraqi appointments; https://mawedkom.com)";

export async function suggestPlaces(q: string): Promise<MapSuggestItem[]> {
  const key = googleMapsKey();
  if (key) {
    const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    url.searchParams.set("input", q);
    url.searchParams.set("language", "ar");
    url.searchParams.set("components", "country:iq");
    url.searchParams.set("key", key);
    const res = await fetch(url, { cache: "no-store" });
    const data = (await res.json()) as {
      predictions?: { place_id: string; description: string }[];
    };
    return (data.predictions || []).map((p) => ({
      id: p.place_id,
      label: p.description,
      placeId: p.place_id,
    }));
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "6");
  url.searchParams.set("accept-language", "ar");
  url.searchParams.set("countrycodes", "iq");
  url.searchParams.set("q", q);
  const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
  const data = (await res.json()) as { display_name: string; lat: string; lon: string }[];
  return (data || []).map((h, i) => ({
    id: `${h.lat},${h.lon},${i}`,
    label: h.display_name,
    lat: Number(h.lat),
    lng: Number(h.lon),
  }));
}

export async function placeDetails(placeId: string): Promise<{ lat: number; lng: number; address: string } | null> {
  const key = googleMapsKey();
  if (!key) return null;
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "geometry,formatted_address,name");
  url.searchParams.set("language", "ar");
  url.searchParams.set("key", key);
  const res = await fetch(url, { cache: "no-store" });
  const data = (await res.json()) as {
    result?: {
      formatted_address?: string;
      name?: string;
      geometry?: { location?: { lat: number; lng: number } };
    };
  };
  const loc = data.result?.geometry?.location;
  if (!loc) return null;
  return {
    lat: loc.lat,
    lng: loc.lng,
    address: data.result?.formatted_address || data.result?.name || "",
  };
}

export async function reverseAddress(lat: number, lng: number): Promise<string> {
  const key = googleMapsKey();
  if (key) {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("latlng", `${lat},${lng}`);
    url.searchParams.set("language", "ar");
    url.searchParams.set("key", key);
    const res = await fetch(url, { cache: "no-store" });
    const data = (await res.json()) as { results?: { formatted_address?: string }[] };
    return data.results?.[0]?.formatted_address || "";
  }
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "json");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("accept-language", "ar");
  const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
  const data = (await res.json()) as { display_name?: string };
  return data.display_name || "";
}
