export function googleMapsViewUrl(lat: number, lng: number, zoom = 16) {
  return `https://www.google.com/maps?q=${lat},${lng}&hl=ar&z=${zoom}`;
}

export function googleMapsEmbedUrl(lat: number, lng: number, zoom = 16) {
  return `https://www.google.com/maps?q=${lat},${lng}&hl=ar&z=${zoom}&output=embed`;
}

export function googleMapsDirectionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&hl=ar`;
}

export function parseGoogleMapsCoords(input: string): { lat: number; lng: number } | null {
  const text = input.trim();
  const at = text.match(/@(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (at) return { lat: Number(at[1]), lng: Number(at[2]) };
  const query = text.match(/[?&]q=(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (query) return { lat: Number(query[1]), lng: Number(query[2]) };
  const place = text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (place) return { lat: Number(place[1]), lng: Number(place[2]) };
  const pair = text.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
  if (pair) return { lat: Number(pair[1]), lng: Number(pair[2]) };
  return null;
}
