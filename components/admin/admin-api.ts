import { ADMIN_PIN } from "@/lib/store-constants";

export function adminHeaders(json = false): HeadersInit {
  return {
    "x-nubo-role": "admin",
    "x-nubo-pin": ADMIN_PIN,
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

export async function adminGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store", headers: adminHeaders() });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || "فشل الطلب.");
  return data;
}

export async function adminSend<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    cache: "no-store",
    headers: adminHeaders(true),
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || "فشل الطلب.");
  return data;
}
