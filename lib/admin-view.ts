import { isoInBaghdad } from "./calendar";
import { walletOf } from "./billing";
import {
  freeTrialDaysLeft,
  freeTrialExpired,
  monthBookingCount,
  normalizePlanId,
  planOf,
  resolveNotifyChannel,
} from "./plans";
import type { BookingRecord, Business, PlanId } from "./types";

export type AdminBusinessRow = {
  slug: string;
  name: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  category: string;
  about: string;
  planId: PlanId;
  planName: string;
  requestedPlanId: PlanId;
  requestedPlanName: string;
  pending: boolean;
  featured: boolean;
  hidden: boolean;
  bookingIntakePaused: boolean;
  approvalMode: "AUTO" | "MANUAL";
  notifyChannel: "owner" | "meta";
  staffCount: number;
  serviceCount: number;
  walletUsd: number;
  trialDaysLeft: number;
  trialExpired: boolean;
  waDeviceSeenAt: string;
  bookingsThisMonth: number;
  photo: string;
  staff: { id: string; name: string; role: string; photo?: string }[];
  galleryPhotos: string[];
};

export function adminBusinessRow(b: Business, bookings: BookingRecord[]): AdminBusinessRow {
  const plan = planOf(b);
  const requested = normalizePlanId(b.requestedPlanId) || plan.id;
  return {
    slug: b.slug,
    name: b.name,
    phone: b.phone,
    city: b.city,
    district: b.district,
    address: b.address,
    category: b.category,
    about: b.about,
    planId: plan.id,
    planName: plan.name,
    requestedPlanId: requested,
    requestedPlanName: planOf({ planId: requested }).name,
    pending: Boolean(requested && requested !== plan.id),
    featured: Boolean(b.featured),
    hidden: Boolean(b.hidden),
    bookingIntakePaused: Boolean(b.bookingIntakePaused),
    approvalMode: b.approvalMode === "MANUAL" ? "MANUAL" : "AUTO",
    notifyChannel: resolveNotifyChannel(b),
    staffCount: (b.staff || []).length,
    serviceCount: (b.services || []).length,
    walletUsd: walletOf(b),
    trialDaysLeft: freeTrialDaysLeft(b),
    trialExpired: freeTrialExpired(b),
    waDeviceSeenAt: b.waDeviceSeenAt || "",
    bookingsThisMonth: monthBookingCount(bookings, b.slug),
    photo: b.photo || "",
    staff: (b.staff || []).map((s) => ({ id: s.id, name: s.name, role: s.role, photo: s.photo })),
    galleryPhotos: b.galleryPhotos || [],
  };
}

export function todayKey() {
  return isoInBaghdad();
}
