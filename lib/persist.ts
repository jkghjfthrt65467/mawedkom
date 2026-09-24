import { promises as fs } from "fs";
import path from "path";
import { ensureSchema, hasDatabase, query } from "./db";
import { readJsonFile, writeJsonFile } from "./json-store";

function fileFor(key: string) {
  if (key.startsWith("business:")) {
    const slug = key.slice("business:".length).replace(/[^a-z0-9_-]/gi, "");
    return path.join(process.cwd(), ".data", "businesses", `${slug}.json`);
  }
  const safe = key.replace(/[^a-z0-9_-]/gi, "") || "doc";
  return path.join(process.cwd(), ".data", `${safe}.json`);
}

export async function readDoc<T>(key: string, fallback: T): Promise<T> {
  if (hasDatabase()) {
    await ensureSchema();
    const rows = await query<{ data: T }>("SELECT data FROM kv WHERE key = $1", [key]);
    return rows[0] ? rows[0].data : fallback;
  }
  return readJsonFile(fileFor(key), fallback);
}

export async function writeDoc(key: string, value: unknown): Promise<void> {
  if (hasDatabase()) {
    await ensureSchema();
    await query(
      `INSERT INTO kv (key, data, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [key, JSON.stringify(value)],
    );
    return;
  }
  await writeJsonFile(fileFor(key), value);
}

export async function hasDoc(key: string): Promise<boolean> {
  if (hasDatabase()) {
    await ensureSchema();
    const rows = await query<{ key: string }>("SELECT key FROM kv WHERE key = $1", [key]);
    return rows.length > 0;
  }
  try {
    await fs.access(fileFor(key));
    return true;
  } catch {
    return false;
  }
}

export async function listDocs<T>(prefix: string): Promise<{ key: string; data: T }[]> {
  if (hasDatabase()) {
    await ensureSchema();
    return query<{ key: string; data: T }>("SELECT key, data FROM kv WHERE key LIKE $1 ORDER BY key", [`${prefix}%`]);
  }
  if (prefix === "business:") {
    const dir = path.join(process.cwd(), ".data", "businesses");
    try {
      const names = await fs.readdir(dir);
      const out: { key: string; data: T }[] = [];
      for (const name of names) {
        if (!name.endsWith(".json")) continue;
        const slug = name.slice(0, -5);
        const data = await readJsonFile<T | null>(path.join(dir, name), null);
        if (data) out.push({ key: `business:${slug}`, data });
      }
      return out;
    } catch {
      return [];
    }
  }
  return [];
}
