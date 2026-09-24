import { readDoc, writeDoc } from "./persist";
import type { WaitlistEntry } from "./types";

const KEY = "waitlist";

export async function listAllWaitlist(): Promise<WaitlistEntry[]> {
  const all = await readDoc<WaitlistEntry[]>(KEY, []);
  return [...all].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export async function listWaitlist(slug: string): Promise<WaitlistEntry[]> {
  const all = await readDoc<WaitlistEntry[]>(KEY, []);
  return all.filter((r) => r.businessSlug === slug);
}

export async function removeWaitlist(id: string): Promise<boolean> {
  const all = await readDoc<WaitlistEntry[]>(KEY, []);
  const next = all.filter((r) => r.id !== id);
  if (next.length === all.length) return false;
  await writeDoc(KEY, next);
  return true;
}

export async function addWaitlist(entry: Omit<WaitlistEntry, "id" | "createdAt"> & { id?: string }): Promise<WaitlistEntry> {
  const all = await readDoc<WaitlistEntry[]>(KEY, []);
  const dup = all.find(
    (r) =>
      r.businessSlug === entry.businessSlug &&
      r.date === entry.date &&
      r.time === entry.time &&
      r.customerPhone === entry.customerPhone,
  );
  if (dup) return dup;
  const next: WaitlistEntry = {
    ...entry,
    id: entry.id || `wl-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  all.unshift(next);
  await writeDoc(KEY, all);
  return next;
}

export async function takeWaitlistForSlot(slug: string, date: string, time: string): Promise<WaitlistEntry[]> {
  const all = await readDoc<WaitlistEntry[]>(KEY, []);
  const hit = all.filter((r) => r.businessSlug === slug && r.date === date && r.time === time);
  if (!hit.length) return [];
  const keep = all.filter((r) => !hit.some((h) => h.id === r.id));
  await writeDoc(KEY, keep);
  return hit;
}
