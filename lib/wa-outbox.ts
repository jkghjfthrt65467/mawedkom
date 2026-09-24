import { ensureSchema, hasDatabase, query } from "./db";
import { normalizeIraqWhatsApp } from "./phone-wa";
import { readDoc, writeDoc } from "./persist";

export type OutboxKind = "customer" | "staff" | "owner" | "reminder" | "waitlist" | "other";
export type OutboxStatus = "pending" | "sent";

export type OutboxItem = {
  id: string;
  slug: string;
  phone: string;
  text: string;
  kind: OutboxKind;
  createdAt: string;
  status: OutboxStatus;
  sentAt?: string;
};

const KEY = "wa-outbox";

function asItem(row: {
  id: string;
  slug: string;
  phone: string;
  text: string;
  kind: string;
  status: string;
  created_at: Date | string;
  sent_at?: Date | string | null;
}): OutboxItem {
  return {
    id: row.id,
    slug: row.slug,
    phone: row.phone,
    text: row.text,
    kind: (row.kind as OutboxKind) || "other",
    status: row.status === "sent" ? "sent" : "pending",
    createdAt: typeof row.created_at === "string" ? row.created_at : row.created_at.toISOString(),
    sentAt: row.sent_at ? (typeof row.sent_at === "string" ? row.sent_at : row.sent_at.toISOString()) : undefined,
  };
}

async function readAll(): Promise<OutboxItem[]> {
  if (hasDatabase()) {
    await ensureSchema();
    const rows = await query<{
      id: string;
      slug: string;
      phone: string;
      text: string;
      kind: string;
      status: string;
      created_at: Date;
      sent_at: Date | null;
    }>("SELECT id, slug, phone, text, kind, status, created_at, sent_at FROM wa_outbox ORDER BY created_at ASC");
    return rows.map(asItem);
  }
  const data = await readDoc<OutboxItem[]>(KEY, []);
  return Array.isArray(data) ? data : [];
}

async function writeAll(rows: OutboxItem[]) {
  await writeDoc(KEY, rows);
}

export async function enqueueOwnerMessage(input: {
  slug: string;
  phone: string;
  text: string;
  kind?: OutboxKind;
}): Promise<OutboxItem | null> {
  const phone = normalizeIraqWhatsApp(input.phone);
  const text = (input.text || "").trim();
  const slug = (input.slug || "").trim();
  if (!phone || !text || !slug) return null;
  const item: OutboxItem = {
    id: `wa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    slug,
    phone,
    text,
    kind: input.kind || "other",
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  if (hasDatabase()) {
    await ensureSchema();
    await query(
      `INSERT INTO wa_outbox (id, slug, phone, text, kind, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6)`,
      [item.id, item.slug, item.phone, item.text, item.kind, item.createdAt],
    );
    return item;
  }
  const rows = await readAll();
  rows.push(item);
  await writeAll(rows);
  return item;
}

export async function listAllPendingOutbox(): Promise<OutboxItem[]> {
  const rows = await readAll();
  return rows.filter((r) => r.status === "pending");
}

export async function listPendingOutbox(slug: string): Promise<OutboxItem[]> {
  if (hasDatabase()) {
    await ensureSchema();
    const rows = await query<{
      id: string;
      slug: string;
      phone: string;
      text: string;
      kind: string;
      status: string;
      created_at: Date;
      sent_at: Date | null;
    }>(
      `SELECT id, slug, phone, text, kind, status, created_at, sent_at
       FROM wa_outbox WHERE slug = $1 AND status = 'pending' ORDER BY created_at ASC`,
      [slug],
    );
    return rows.map(asItem);
  }
  const rows = await readAll();
  return rows.filter((r) => r.slug === slug && r.status === "pending");
}

export async function outboxCounts(slug: string) {
  if (hasDatabase()) {
    await ensureSchema();
    const rows = await query<{ status: string; n: string }>(
      "SELECT status, COUNT(*)::text AS n FROM wa_outbox WHERE slug = $1 GROUP BY status",
      [slug],
    );
    const map = Object.fromEntries(rows.map((r) => [r.status, Number(r.n)]));
    return { pending: map.pending || 0, sent: map.sent || 0 };
  }
  const rows = await readAll();
  const mine = rows.filter((r) => r.slug === slug);
  return {
    pending: mine.filter((r) => r.status === "pending").length,
    sent: mine.filter((r) => r.status === "sent").length,
  };
}

export async function markOutboxSent(slug: string, ids: string[]) {
  const want = ids.filter(Boolean);
  if (!want.length) return 0;
  if (hasDatabase()) {
    await ensureSchema();
    const rows = await query<{ id: string }>(
      `UPDATE wa_outbox
       SET status = 'sent', sent_at = now()
       WHERE slug = $1 AND status = 'pending' AND id = ANY($2::text[])
       RETURNING id`,
      [slug, want],
    );
    return rows.length;
  }
  const now = new Date().toISOString();
  const rows = await readAll();
  let changed = 0;
  const next = rows.map((r) => {
    if (r.slug !== slug || r.status === "sent" || !want.includes(r.id)) return r;
    changed += 1;
    return { ...r, status: "sent" as const, sentAt: now };
  });
  if (changed) await writeAll(next);
  return changed;
}
