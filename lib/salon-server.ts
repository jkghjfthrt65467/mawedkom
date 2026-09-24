import { businessBySlug } from "./data";
import { readDoc, writeDoc } from "./persist";
import { MANAGED_SLUG } from "./store-constants";

export type SalonNotifySettings = {
  slug: string;
  name: string;
  phone: string;
  ownerNotifyPhone: string;
  reminderEnabled: boolean;
};

const KEY = "salon";

function seedSettings(slug = MANAGED_SLUG): SalonNotifySettings {
  const seed = businessBySlug(slug);
  return {
    slug,
    name: seed?.name || "المشروع",
    phone: seed?.phone || "",
    ownerNotifyPhone: "",
    reminderEnabled: true,
  };
}

export function resolveOwnerNotifyPhone(salon: Pick<SalonNotifySettings, "phone" | "ownerNotifyPhone">): string {
  return (salon.ownerNotifyPhone || "").trim() || (salon.phone || "").trim();
}

async function readFile(): Promise<SalonNotifySettings | null> {
  const parsed = await readDoc<Partial<SalonNotifySettings> | null>(KEY, null);
  if (!parsed || typeof parsed !== "object") return null;
  const base = seedSettings(parsed.slug || MANAGED_SLUG);
  return {
    ...base,
    ...parsed,
    slug: String(parsed.slug || base.slug),
    name: String(parsed.name || base.name),
    phone: String(parsed.phone || base.phone),
    ownerNotifyPhone: String(parsed.ownerNotifyPhone || ""),
    reminderEnabled: parsed.reminderEnabled !== false,
  };
}

export async function getSalonSettings(slug?: string): Promise<SalonNotifySettings> {
  const saved = await readFile();
  if (saved && (!slug || saved.slug === slug)) return saved;
  return seedSettings(slug || MANAGED_SLUG);
}

export async function saveSalonSettings(patch: Partial<SalonNotifySettings>): Promise<SalonNotifySettings> {
  const prev = await getSalonSettings(patch.slug);
  const next: SalonNotifySettings = {
    slug: String(patch.slug || prev.slug),
    name: String(patch.name ?? prev.name),
    phone: String(patch.phone ?? prev.phone),
    ownerNotifyPhone: String(patch.ownerNotifyPhone ?? prev.ownerNotifyPhone ?? ""),
    reminderEnabled: patch.reminderEnabled !== undefined ? Boolean(patch.reminderEnabled) : prev.reminderEnabled,
  };
  await writeDoc(KEY, next);
  return next;
}
