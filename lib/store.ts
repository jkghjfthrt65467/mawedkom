"use client";

import { announceBookingsChanged } from "./booking-live";
import { createManageToken } from "./booking-token";
import { ADMIN_KEY, ADMIN_PIN, ACTIVE_SLUG_KEY, BUSINESS_EVENT, MANAGED_SLUG, MANAGER_PIN, MEDIA_EVENT, STAFF_PIN, STAFF_SESSION_KEY } from "./store-constants";
import type { BookingRecord, Business, Staff, UserAccount } from "./types";
import type { BookingActor } from "./staff-permissions";

export { ADMIN_PIN, BUSINESS_EVENT, MANAGED_SLUG, MANAGER_PIN, MEDIA_EVENT, STAFF_PIN };

const USER_KEY = "nubo-user";
const BOOK_KEY = "nubo-bookings";
const FAV_KEY = "nubo-favs";
const MGR_KEY = "nubo-manager";
const BIZ_KEY = "nubo-managed-business";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getActiveSlug(): string {
  const stored = read<string>(ACTIVE_SLUG_KEY, "");
  if (stored) return stored;
  const overlay = read<{ slug?: string } | null>(BIZ_KEY, null);
  return overlay?.slug || MANAGED_SLUG;
}

export function setActiveSlug(slug: string) {
  write(ACTIVE_SLUG_KEY, slug);
}

function withManageToken(b: BookingRecord): BookingRecord {
  if (b.manageToken) return b;
  return { ...b, manageToken: createManageToken() };
}

export function getUser(): UserAccount | null {
  return read<UserAccount | null>(USER_KEY, null);
}

export function setUser(user: UserAccount) {
  write(USER_KEY, user);
}

export function logout() {
  localStorage.removeItem(USER_KEY);
}

export function getBookings(): BookingRecord[] {
  const raw = read<BookingRecord[]>(BOOK_KEY, []);
  let changed = false;
  const list = raw.map((b) => {
    if (b.manageToken) return b;
    changed = true;
    return withManageToken(b);
  });
  if (changed) write(BOOK_KEY, list);
  return list;
}

export type BookingSyncResult = {
  ok?: boolean;
  error?: string;
  booking?: BookingRecord;
  isNew?: boolean;
  whatsapp?: {
    customer?: { ok?: boolean; skipped?: boolean; message?: string; jid?: string };
    owner?: { ok?: boolean; skipped?: boolean; message?: string; jid?: string };
    staff?: { ok?: boolean; skipped?: boolean; message?: string; jid?: string };
  };
};

export type BookingWriteExtra = {
  ownerNotifyPhone?: string;
  actor?: BookingActor;
  silent?: boolean;
};

export function calendarActor(role: "owner" | "staff", staffId?: string): BookingActor {
  if (role === "owner") return { role: "owner", pin: MANAGER_PIN };
  return { role: "staff", pin: STAFF_PIN, staffId };
}

export function addBooking(b: BookingRecord, extra?: BookingWriteExtra) {
  const rec = withManageToken(b);
  write(BOOK_KEY, [rec, ...getBookings().filter((x) => x.id !== rec.id && x.manageToken !== rec.manageToken)]);
  return syncBookingToServer(rec, extra).then((synced) => {
    if (synced && synced.ok === false && synced.error) {
      write(
        BOOK_KEY,
        getBookings().filter((x) => x.id !== rec.id && x.manageToken !== rec.manageToken),
      );
    } else if (synced?.booking) {
      upsertBookingLocal(synced.booking);
    }
    if (!synced || synced.ok !== false) announceBookingsChanged(rec.businessSlug);
    return synced;
  });
}

function upsertBookingLocal(ready: BookingRecord) {
  const list = getBookings();
  const idx = list.findIndex((b) => b.id === ready.id || b.manageToken === ready.manageToken);
  if (idx >= 0) list[idx] = { ...list[idx], ...ready };
  else list.unshift(ready);
  write(BOOK_KEY, list);
}

export function updateBooking(id: string, patch: Partial<BookingRecord>, actor?: BookingActor) {
  const next = getBookings().map((b) => (b.id === id ? { ...b, ...patch } : b));
  write(BOOK_KEY, next);
  const rec = next.find((b) => b.id === id);
  if (rec) {
    void syncBookingToServer(rec, actor ? { actor } : undefined);
    announceBookingsChanged(rec.businessSlug);
  }
}

export function upsertBooking(rec: BookingRecord, actor?: BookingActor) {
  const ready = withManageToken(rec);
  upsertBookingLocal(ready);
  void syncBookingToServer(ready, actor ? { actor } : undefined);
  announceBookingsChanged(ready.businessSlug);
  return ready;
}

export function getBookingByToken(token: string): BookingRecord | null {
  if (!token) return null;
  return getBookings().find((b) => b.manageToken === token) || null;
}

export function updateBookingByToken(token: string, patch: Partial<BookingRecord>): BookingRecord | null {
  const list = getBookings();
  const idx = list.findIndex((b) => b.manageToken === token);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, manageToken: list[idx].manageToken, id: list[idx].id };
  list[idx] = next;
  write(BOOK_KEY, list);
  void syncBookingToServer(next);
  return next;
}

export async function fetchBookingByToken(token: string): Promise<BookingRecord | null> {
  try {
    const res = await fetch(`/api/bookings/${encodeURIComponent(token)}`, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { booking?: BookingRecord };
      if (data.booking) {
        upsertBooking(data.booking);
        return data.booking;
      }
    }
  } catch {
    /* fall through to local */
  }
  return getBookingByToken(token);
}

async function syncBookingToServer(
  rec: BookingRecord,
  extra?: BookingWriteExtra,
): Promise<BookingSyncResult> {
  try {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...rec,
        ownerNotifyPhone: extra?.ownerNotifyPhone,
        actor: extra?.actor,
        silent: extra?.silent,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as BookingSyncResult;
    if (!res.ok) {
      return { ok: false, error: data.error || `فشل حفظ الموعد (${res.status})` };
    }
    return data;
  } catch {
    return { ok: false };
  }
}

export function getFavs(): string[] {
  return read<string[]>(FAV_KEY, []);
}

export function toggleFav(slug: string) {
  const favs = getFavs();
  write(FAV_KEY, favs.includes(slug) ? favs.filter((s) => s !== slug) : [...favs, slug]);
}

export function isManagerAuthed(): boolean {
  const rec = read<{ ok?: boolean } | boolean | null>(MGR_KEY, null);
  if (rec === true) return true;
  return Boolean(rec && typeof rec === "object" && rec.ok);
}

export function loginManager(pin: string): boolean {
  if (pin.trim() !== MANAGER_PIN) return false;
  write(MGR_KEY, { ok: true, at: Date.now(), role: "مدير المشروع" });
  return true;
}

export function logoutManager() {
  localStorage.removeItem(MGR_KEY);
}

export function isAdminAuthed() {
  const rec = read<{ ok?: boolean } | boolean | null>(ADMIN_KEY, null);
  if (rec === true) return true;
  return Boolean(rec && typeof rec === "object" && rec.ok);
}

export function loginAdmin(pin: string): boolean {
  if (pin.trim() !== ADMIN_PIN) return false;
  write(ADMIN_KEY, { ok: true, at: Date.now(), role: "أدمن الموقع" });
  return true;
}

export function logoutAdmin() {
  localStorage.removeItem(ADMIN_KEY);
}

export function notifyMediaChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(MEDIA_EVENT));
  }
}

export function getManagedBusiness(): Business | null {
  const rec = read<Business | null>(BIZ_KEY, null);
  if (!rec || !rec.slug) return null;
  return rec;
}

export function saveManagedBusiness(business: Business) {
  write(BIZ_KEY, business);
  setActiveSlug(business.slug);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(BUSINESS_EVENT));
  }
  void syncSalonToServer(business);
}

async function syncSalonToServer(business: Business) {
  try {
    await fetch("/api/salon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: business.slug,
        name: business.name,
        phone: business.phone,
        ownerNotifyPhone: business.ownerNotifyPhone || "",
        reminderEnabled: business.reminderEnabled !== false,
      }),
    });
  } catch {
    /* local salon still saved */
  }
  try {
    await fetch("/api/business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(business),
    });
  } catch {
    /* overlay still in localStorage */
  }
}

export function subscribeManagedBusiness(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (!e.key || e.key === BIZ_KEY) onChange();
  };
  window.addEventListener(BUSINESS_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(BUSINESS_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function bookingsForBusiness(slug: string): BookingRecord[] {
  return getBookings().filter((b) => b.businessSlug === slug);
}

export type StaffSession = { staffId: string; name: string; at: number };

export function getStaffSession(): StaffSession | null {
  const rec = read<StaffSession | null>(STAFF_SESSION_KEY, null);
  if (!rec?.staffId) return null;
  return rec;
}

export function loginStaff(staffId: string, pin: string, roster: Staff[]): StaffSession | null {
  if (pin.trim() !== STAFF_PIN) return null;
  const staff = roster.find((s) => s.id === staffId);
  if (!staff) return null;
  const session: StaffSession = { staffId: staff.id, name: staff.name, at: Date.now() };
  write(STAFF_SESSION_KEY, session);
  return session;
}

export function logoutStaff() {
  localStorage.removeItem(STAFF_SESSION_KEY);
}

export function mergeBookingLists(local: BookingRecord[], server: BookingRecord[]): BookingRecord[] {
  const map = new Map<string, BookingRecord>();
  for (const b of local) map.set(b.manageToken || b.id, b);
  for (const b of server) {
    const key = b.manageToken || b.id;
    map.set(key, { ...map.get(key), ...b });
  }
  return [...map.values()].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    if (a.time !== b.time) return a.time < b.time ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

export async function fetchBusinessBookings(slug: string): Promise<BookingRecord[]> {
  const local = bookingsForBusiness(slug);
  try {
    const res = await fetch(`/api/bookings?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
    const data = (await res.json()) as { bookings?: BookingRecord[] };
    const server = (data.bookings || []).filter((b) => b.businessSlug === slug);
    const merged = mergeBookingLists(local, server);
    const others = getBookings().filter((b) => b.businessSlug !== slug);
    write(BOOK_KEY, [...merged, ...others]);
    return merged;
  } catch {
    return local;
  }
}
