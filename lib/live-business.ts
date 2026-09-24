"use client";

import { useEffect, useState } from "react";
import { hoursSummary, weekdayHoursFromLegacy } from "./availability";
import { mergeStaffFromSeed } from "./staff-merge";
import { fetchMediaOverlay, subscribeMedia, withMedia, withMediaList } from "./media-client";
import { withServiceDefaults, sortedServices } from "./services";
import { withStaffPermissionDefaults } from "./staff-permissions";
import { getActiveSlug, MANAGED_SLUG, getManagedBusiness, subscribeManagedBusiness } from "./store";
import { resolveNotifyChannel } from "./plans";
import type { Business } from "./types";

export function withOwnerDefaults(b: Business): Business {
  const weekdayHours = b.weekdayHours?.length ? b.weekdayHours : weekdayHoursFromLegacy(b.hours);
  const phoneDigits = b.phone.replace(/\D/g, "");
  const waNumber = phoneDigits.startsWith("964") ? phoneDigits : `964${phoneDigits.replace(/^0/, "")}`;
  return {
    ...b,
    weekdayHours,
    weeklyOffDays: b.weeklyOffDays || [],
    holidayDates: b.holidayDates || [],
    hours: b.hours?.length ? b.hours : hoursSummary(weekdayHours),
    approvalMode: b.approvalMode || "AUTO",
    whatsappLink: b.whatsappLink || `https://wa.me/${waNumber}`,
    bookingIntakePaused: Boolean(b.bookingIntakePaused),
    hidden: Boolean(b.hidden),
    showStaffPicker: b.showStaffPicker !== false,
    reminderEnabled: b.reminderEnabled !== false,
    staffWhatsAppEnabled: b.staffWhatsAppEnabled !== false,
    notifyChannel: resolveNotifyChannel(b),
    metaWalletUsd: b.metaWalletUsd || 0,
    bufferMin: b.bufferMin || 0,
    ownerNotifyPhone: b.ownerNotifyPhone || "",
    services: sortedServices(withServiceDefaults(b.services || [])),
    staff: b.staff.map((s) => {
      const ready = withStaffPermissionDefaults(s);
      return {
        ...ready,
        photo: ready.photo || "",
        bio: ready.bio || "",
        galleryPhotos: ready.galleryPhotos || [],
        reviews: ready.reviews || [],
        bookingPaused: Boolean(ready.bookingPaused),
      };
    }),
  };
}

export function resolveBusiness(seed: Business): Business {
  const overlay = getManagedBusiness();
  const merged =
    overlay && overlay.slug === seed.slug
      ? withOwnerDefaults({
          ...seed,
          ...overlay,
          slug: seed.slug,
          reviews: overlay.reviews?.length ? overlay.reviews : seed.reviews,
          rating: overlay.rating || seed.rating,
          reviewCount: overlay.reviewCount || seed.reviewCount,
          staff: mergeStaffFromSeed(seed, overlay),
        })
      : withOwnerDefaults(seed);
  return withMedia(merged);
}

export function resolveBusinessList(list: Business[]): Business[] {
  return withMediaList(list.map(resolveBusiness));
}

export function useLiveBusiness(seed: Business): Business {
  const [live, setLive] = useState(seed);

  useEffect(() => {
    const sync = () => setLive(resolveBusiness(seed));
    sync();
    void fetchMediaOverlay().then(sync);
    const unsubBiz = subscribeManagedBusiness(sync);
    const unsubMedia = subscribeMedia(sync);
    return () => {
      unsubBiz();
      unsubMedia();
    };
  }, [seed.slug]);

  return live;
}

export function useLiveBusinesses(list: Business[]): Business[] {
  const [live, setLive] = useState(list);

  useEffect(() => {
    const sync = () => setLive(resolveBusinessList(list));
    sync();
    void fetchMediaOverlay().then(sync);
    const unsubBiz = subscribeManagedBusiness(sync);
    const unsubMedia = subscribeMedia(sync);
    return () => {
      unsubBiz();
      unsubMedia();
    };
  }, [list.map((b) => b.slug).join(",")]);

  return live;
}

export function isManagedSlug(slug: string) {
  if (typeof window === "undefined") return slug === MANAGED_SLUG;
  return slug === MANAGED_SLUG || slug === getActiveSlug() || getManagedBusiness()?.slug === slug;
}
