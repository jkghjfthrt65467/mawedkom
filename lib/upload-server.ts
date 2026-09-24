import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { ADMIN_PIN, MANAGER_PIN, STAFF_PIN } from "./store-constants";

export const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_BYTES = 6 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export type UploadActor = "owner" | "admin" | "staff";

export function actorFromRequest(req: Request): UploadActor | null {
  const pin = (req.headers.get("x-nubo-pin") || "").trim();
  const role = (req.headers.get("x-nubo-role") || "").trim();
  if (role === "admin" && pin === ADMIN_PIN) return "admin";
  if (role === "owner" && pin === MANAGER_PIN) return "owner";
  if (role === "staff" && pin === STAFF_PIN) return "staff";
  return null;
}

export function publicUrlToFilename(url: string): string | null {
  if (!url || !url.startsWith("/uploads/")) return null;
  const name = decodeURIComponent(url.slice("/uploads/".length).split("?")[0] || "");
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) return null;
  return name;
}

export async function saveUploadFile(file: File, prefix: string): Promise<string> {
  const ext = TYPES[file.type];
  if (!ext) throw new Error("نوع الصورة غير مدعوم. استخدم JPG أو PNG أو WEBP.");
  if (file.size > MAX_BYTES) throw new Error("الصورة أكبر من 6 ميغابايت.");
  const buf = Buffer.from(await file.arrayBuffer());
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60) || "img";
  const name = `${safePrefix}-${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
  return `/uploads/${name}`;
}

export async function deleteUploadFile(url: string): Promise<boolean> {
  const name = publicUrlToFilename(url);
  if (!name) return false;
  try {
    await fs.unlink(path.join(UPLOAD_DIR, name));
    return true;
  } catch {
    return false;
  }
}
