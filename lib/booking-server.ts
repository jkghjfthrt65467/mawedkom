import { ensureSchema, hasDatabase, query } from "./db";
import { readDoc, writeDoc } from "./persist";
import type { BookingRecord } from "./types";

const KEY = "bookings";

async function readAll(): Promise<BookingRecord[]> {
  if (hasDatabase()) {
    await ensureSchema();
    const rows = await query<{ data: BookingRecord }>("SELECT data FROM bookings ORDER BY updated_at DESC");
    return rows.map((row) => row.data).filter((b) => Boolean(b?.id));
  }
  const parsed = await readDoc<BookingRecord[]>(KEY, []);
  return Array.isArray(parsed) ? parsed : [];
}

async function writeAll(list: BookingRecord[]): Promise<void> {
  await writeDoc(KEY, list);
}

export async function listServerBookings(): Promise<BookingRecord[]> {
  return readAll();
}

function mergeBooking(prev: BookingRecord, rec: BookingRecord): BookingRecord {
  return {
    ...prev,
    ...rec,
    manageToken: prev.manageToken,
    id: prev.id,
    reminderSentAt: rec.reminderSentAt ?? prev.reminderSentAt,
    reminder24SentAt: rec.reminder24SentAt ?? prev.reminder24SentAt,
  };
}

export async function upsertServerBooking(rec: BookingRecord): Promise<{ booking: BookingRecord; isNew: boolean }> {
  if (hasDatabase()) {
    await ensureSchema();
    const found = await query<{ id: string; data: BookingRecord }>(
      "SELECT id, data FROM bookings WHERE id = $1 OR manage_token = $2 LIMIT 1",
      [rec.id, rec.manageToken],
    );
    if (found[0]) {
      const next = mergeBooking(found[0].data, rec);
      await query(
        `UPDATE bookings
         SET data = $1::jsonb, business_slug = $2, manage_token = $3, updated_at = now()
         WHERE id = $4`,
        [JSON.stringify(next), next.businessSlug, next.manageToken, found[0].id],
      );
      return { booking: next, isNew: false };
    }
    await query(
      `INSERT INTO bookings (id, manage_token, business_slug, data, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, now())`,
      [rec.id, rec.manageToken, rec.businessSlug, JSON.stringify(rec)],
    );
    return { booking: rec, isNew: true };
  }

  const list = await readAll();
  const idx = list.findIndex((b) => b.manageToken === rec.manageToken || b.id === rec.id);
  if (idx >= 0) {
    const next = mergeBooking(list[idx], rec);
    list[idx] = next;
    await writeAll(list);
    return { booking: next, isNew: false };
  }
  list.unshift(rec);
  await writeAll(list);
  return { booking: rec, isNew: true };
}

export async function getServerBookingByToken(token: string): Promise<BookingRecord | null> {
  if (!token) return null;
  if (hasDatabase()) {
    await ensureSchema();
    const rows = await query<{ data: BookingRecord }>("SELECT data FROM bookings WHERE manage_token = $1 LIMIT 1", [token]);
    return rows[0]?.data || null;
  }
  const list = await readAll();
  return list.find((b) => b.manageToken === token) || null;
}

export async function patchServerBooking(
  token: string,
  patch: Partial<BookingRecord>,
): Promise<BookingRecord | null> {
  if (hasDatabase()) {
    await ensureSchema();
    const rows = await query<{ id: string; data: BookingRecord }>(
      "SELECT id, data FROM bookings WHERE manage_token = $1 LIMIT 1",
      [token],
    );
    if (!rows[0]) return null;
    const next = { ...rows[0].data, ...patch, manageToken: rows[0].data.manageToken, id: rows[0].data.id };
    await query(
      `UPDATE bookings
       SET data = $1::jsonb, business_slug = $2, updated_at = now()
       WHERE id = $3`,
      [JSON.stringify(next), next.businessSlug, rows[0].id],
    );
    return next;
  }
  const list = await readAll();
  const idx = list.findIndex((b) => b.manageToken === token);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, manageToken: list[idx].manageToken, id: list[idx].id };
  list[idx] = next;
  await writeAll(list);
  return next;
}
