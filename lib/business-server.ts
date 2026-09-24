import { BUSINESSES, businessBySlug } from "./data";
import { weekdayHoursFromLegacy } from "./availability";
import { withStaffPermissionDefaults } from "./staff-permissions";
import { sortedServices, withServiceDefaults } from "./services";
import { mergeStaffFromSeed } from "./staff-merge";
import { deleteDoc, hasDoc, listDocs, readDoc, writeDoc } from "./persist";
import { MANAGED_SLUG } from "./store-constants";
import type { Business } from "./types";

function bizKey(slug: string) {
  return `business:${slug.replace(/[^a-z0-9_-]/gi, "")}`;
}

function seedBusiness(slug = MANAGED_SLUG): Business | null {
  const seed = businessBySlug(slug);
  if (!seed) return null;
  return {
    ...seed,
    weekdayHours: seed.weekdayHours?.length ? seed.weekdayHours : weekdayHoursFromLegacy(seed.hours),
    weeklyOffDays: seed.weeklyOffDays || [],
    holidayDates: seed.holidayDates || [],
    approvalMode: seed.approvalMode || "AUTO",
    bookingIntakePaused: Boolean(seed.bookingIntakePaused),
    bufferMin: seed.bufferMin || 0,
    staff: (seed.staff || []).map(withStaffPermissionDefaults),
    services: sortedServices(withServiceDefaults(seed.services || [])),
  };
}

function normalize(business: Business): Business {
  return {
    ...business,
    staff: (business.staff || []).map(withStaffPermissionDefaults),
    services: sortedServices(withServiceDefaults(business.services || [])),
  };
}

async function readStored(slug: string): Promise<Business | null> {
  const parsed = await readDoc<Business | null>(bizKey(slug), null);
  if (!parsed?.slug) return null;
  return normalize(parsed);
}

export async function getManagedBusinessFromDisk(slug = MANAGED_SLUG): Promise<Business | null> {
  const fromDir = await readStored(slug);
  if (fromDir && fromDir.slug === slug) {
    const seed = seedBusiness(slug);
    const base = seed || fromDir;
    return normalize({ ...base, ...fromDir, slug, staff: mergeStaffFromSeed(base, fromDir) });
  }
  if (slug === MANAGED_SLUG) {
    const legacy = await readDoc<Business | null>("managed-business", null);
    if (legacy?.slug) {
      const seed = seedBusiness(slug);
      const base = seed || legacy;
      return normalize({ ...base, ...legacy, slug, staff: mergeStaffFromSeed(base, legacy) });
    }
  }
  return seedBusiness(slug);
}

export async function saveManagedBusinessToDisk(business: Business): Promise<Business> {
  const ready = normalize(business);
  await writeDoc(bizKey(ready.slug), ready);
  if (ready.slug === MANAGED_SLUG) {
    await writeDoc("managed-business", ready);
  }
  return ready;
}

export async function listManagedBusinesses(): Promise<Business[]> {
  const rows = await listDocs<Business>("business:");
  const out = rows.map((row) => normalize(row.data)).filter((biz) => Boolean(biz.slug));
  if (!out.some((b) => b.slug === MANAGED_SLUG)) {
    const demo = await getManagedBusinessFromDisk(MANAGED_SLUG);
    if (demo) out.unshift(demo);
  }
  return out;
}

export function makeBusinessSlug(): string {
  return `mawed-${Date.now().toString(36)}`;
}

export function blankBusiness(input: {
  name: string;
  phone: string;
  city: string;
  category: string;
  ownerName?: string;
}): Business {
  const slug = makeBusinessSlug();
  const hours = [
    { days: "السبت — الخميس", open: "09:00", close: "22:00" },
    { days: "الجمعة", open: "14:00", close: "22:00" },
  ];
  return {
    slug,
    name: input.name.trim(),
    category: input.category,
    city: input.city,
    district: "",
    address: "",
    phone: input.phone.replace(/\s/g, ""),
    about: `${input.name.trim()} على موعدكم. الحجز من الرابط مباشرة.`,
    rating: 5,
    reviewCount: 0,
    accent: "#ff7802",
    coverTone: "from-[#2a1810] to-[#ff7802]",
    hours,
    weekdayHours: weekdayHoursFromLegacy(hours),
    services: [{ id: "sv-1", name: "خدمة أساسية", durationMin: 30, priceIqd: 10000, sortOrder: 0 }],
    staff: [
      {
        id: "st-1",
        name: input.ownerName?.trim() || "المسؤول",
        role: "مسؤول",
        initials: "م",
        serviceIds: ["sv-1"],
        canEditOwnAppointments: true,
        canEditOtherStaffAppointments: true,
      },
    ],
    reviews: [],
    galleryLabels: [],
    featured: true,
    hidden: false,
    approvalMode: "AUTO",
    reminderEnabled: true,
    staffWhatsAppEnabled: true,
    notifyChannel: "owner",
    metaWalletUsd: 0,
    bufferMin: 0,
    planId: "free",
    freeStartedAt: new Date().toISOString(),
    freeUsed: false,
  };
}

export async function ownerCanEditSlug(slug: string): Promise<boolean> {
  if (slug === MANAGED_SLUG) return true;
  return hasDoc(bizKey(slug));
}

export async function getPublicBusiness(slug: string): Promise<Business | null> {
  const disk = await getManagedBusinessFromDisk(slug);
  if (disk) return disk;
  return businessBySlug(slug) || null;
}

export async function adminCatalog(): Promise<Business[]> {
  const disk = await listManagedBusinesses();
  const map = new Map<string, Business>();
  for (const b of BUSINESSES) map.set(b.slug, b);
  for (const b of disk) {
    const prev = map.get(b.slug);
    map.set(b.slug, prev ? { ...prev, ...b, slug: b.slug } : b);
  }
  return [...map.values()];
}

export async function publicCatalog(): Promise<Business[]> {
  return (await adminCatalog()).filter((b) => !b.hidden);
}

export async function deleteManagedBusiness(slug: string): Promise<boolean> {
  const key = bizKey(slug);
  const existed = await hasDoc(key);
  if (existed) await deleteDoc(key);
  if (slug === MANAGED_SLUG) await deleteDoc("managed-business");
  const seed = businessBySlug(slug);
  if (seed) {
    await saveManagedBusinessToDisk({
      ...seed,
      hidden: true,
      bookingIntakePaused: true,
      featured: false,
    });
    return true;
  }
  return existed;
}
