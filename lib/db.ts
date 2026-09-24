import { Pool, type QueryResultRow } from "pg";

let pool: Pool | null = null;
let schemaPromise: Promise<void> | null = null;

export function databaseUrl(): string {
  return (process.env.DATABASE_URL || "").trim();
}

export function hasDatabase(): boolean {
  return Boolean(databaseUrl());
}

function sslFor(url: string) {
  if (/localhost|127\.0\.0\.1/.test(url)) return undefined;
  return { rejectUnauthorized: false } as const;
}

export function getPool(): Pool {
  const url = databaseUrl();
  if (!url) throw new Error("DATABASE_URL غير موجود");
  if (!pool) {
    pool = new Pool({
      connectionString: url,
      max: 5,
      ssl: sslFor(url),
    });
  }
  return pool;
}

export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await getPool().query<T>(text, params);
  return res.rows;
}

export async function ensureSchema(): Promise<void> {
  if (!hasDatabase()) return;
  if (!schemaPromise) {
    schemaPromise = createSchema().catch((err) => {
      schemaPromise = null;
      throw err;
    });
  }
  await schemaPromise;
}

async function createSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS kv (
      key TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      manage_token TEXT NOT NULL UNIQUE,
      business_slug TEXT NOT NULL,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS bookings_slug_idx ON bookings (business_slug);

    CREATE TABLE IF NOT EXISTS wa_outbox (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL,
      phone TEXT NOT NULL,
      text TEXT NOT NULL,
      kind TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      sent_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS wa_outbox_slug_status_idx ON wa_outbox (slug, status);
  `);
}

export async function pingDatabase(): Promise<boolean> {
  if (!hasDatabase()) return false;
  await ensureSchema();
  await query("SELECT 1 AS ok");
  return true;
}
