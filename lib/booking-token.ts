import { SITE_URL } from "./brand";

export function createManageToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 14)}`;
}

export function getPublicBaseUrl(): string {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "").trim().replace(/\/$/, "");
  if (env) return env;
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return SITE_URL;
}

export function originFromRequest(req?: Request): string {
  if (req) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "http";
    if (host) return `${proto}://${host}`;
  }
  return getPublicBaseUrl();
}

export function manageAppointmentUrl(token: string, baseUrl = getPublicBaseUrl()): string {
  const origin = baseUrl.replace(/\/$/, "");
  return `${origin}/m/${token}`;
}

export function teamCalendarUrl(
  role: "owner" | "staff",
  rec: { date?: string; id?: string },
  baseUrl = getPublicBaseUrl(),
): string {
  const origin = baseUrl.replace(/\/$/, "");
  const path = role === "staff" ? "/staff" : "/business/manage/calendar";
  const q = new URLSearchParams();
  if (rec.date && /^\d{4}-\d{2}-\d{2}$/.test(rec.date)) q.set("date", rec.date);
  if (rec.id) q.set("id", rec.id);
  const qs = q.toString();
  return qs ? `${origin}${path}?${qs}` : `${origin}${path}`;
}
