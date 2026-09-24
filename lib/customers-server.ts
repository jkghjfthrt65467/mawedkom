import { readDoc, writeDoc } from "./persist";
import type { CustomerProfile } from "./types";

const KEY = "customers";

type Row = CustomerProfile & { businessSlug: string };

function keyOf(slug: string, phone: string) {
  return `${slug}:${phone.replace(/\D/g, "")}`;
}

export async function listCustomers(slug: string): Promise<CustomerProfile[]> {
  const all = await readDoc<Row[]>(KEY, []);
  return all
    .filter((r) => r.businessSlug === slug)
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
}

export async function upsertCustomer(slug: string, patch: { phone: string; name?: string; notes?: string; bumpVisit?: boolean }): Promise<CustomerProfile> {
  const phone = patch.phone.replace(/\D/g, "");
  const all = await readDoc<Row[]>(KEY, []);
  const idx = all.findIndex((r) => keyOf(r.businessSlug, r.phone) === keyOf(slug, phone));
  const prev = idx >= 0 ? all[idx] : undefined;
  const next: Row = {
    businessSlug: slug,
    phone: patch.phone.replace(/\s/g, ""),
    name: (patch.name || prev?.name || "").trim() || prev?.name || "زبون",
    notes: patch.notes != null ? patch.notes : prev?.notes || "",
    updatedAt: new Date().toISOString(),
    visitCount: (prev?.visitCount || 0) + (patch.bumpVisit ? 1 : 0),
  };
  if (idx >= 0) all[idx] = next;
  else all.unshift(next);
  await writeDoc(KEY, all);
  const { businessSlug: _s, ...pub } = next;
  return pub;
}
