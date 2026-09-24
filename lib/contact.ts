import { googleMapsViewUrl } from "./maps";
import type { Business } from "./types";

export function iraqPhoneKey(phone: string): string {
  let digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("964")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

export function iraqTelHref(phone: string) {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  const intl = digits.startsWith("964") ? digits : `964${digits.replace(/^0/, "")}`;
  return `tel:+${intl}`;
}

export function iraqWaHref(phone: string, fallback?: string) {
  if (fallback) return fallback;
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  const intl = digits.startsWith("964") ? digits : `964${digits.replace(/^0/, "")}`;
  return `https://wa.me/${intl}`;
}

export function businessWaHref(business: Pick<Business, "phone" | "whatsappLink">) {
  return iraqWaHref(business.phone, business.whatsappLink);
}

export function businessMapHref(business: Pick<Business, "lat" | "lng" | "slug">) {
  if (business.lat && business.lng) return googleMapsViewUrl(business.lat, business.lng);
  return `/salon/${business.slug}`;
}

export function staffProfileHref(slug: string, staffId: string) {
  return `/salon/${slug}/staff/${staffId}`;
}

export function businessCover(business: Pick<Business, "coverPhoto" | "photo">) {
  return business.coverPhoto || business.photo || "";
}

export function businessAvatar(business: Pick<Business, "avatar">) {
  return business.avatar || "";
}
