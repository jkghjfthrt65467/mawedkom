import { normalizeIraqWhatsApp } from "./phone-wa";

const GRAPH = "https://graph.facebook.com/v21.0";

export function metaConfigured() {
  return Boolean(process.env.META_WHATSAPP_TOKEN && process.env.META_PHONE_NUMBER_ID);
}

export async function sendMetaWhatsApp(
  phone: string,
  text: string,
): Promise<{ ok: boolean; skipped?: boolean; message: string; jid?: string }> {
  const to = normalizeIraqWhatsApp(phone);
  if (!to) return { ok: false, skipped: true, message: "الرقم ناقص." };
  if (!text.trim()) return { ok: false, skipped: true, message: "نص الرسالة ناقص." };
  const token = process.env.META_WHATSAPP_TOKEN || "";
  const phoneId = process.env.META_PHONE_NUMBER_ID || "";
  if (!token || !phoneId) {
    return {
      ok: true,
      message: "رصيد إشعارات المنصة انحسب. الإرسال من المنصة يتفعّل بعد ربط القناة على السيرفر.",
      jid: `${to}@s.whatsapp.net`,
    };
  }
  try {
    const res = await fetch(`${GRAPH}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text, preview_url: false },
      }),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as { error?: { message?: string }; messages?: { id?: string }[] };
    if (!res.ok) {
      return { ok: false, message: data.error?.message || `فشل إرسال المنصة (${res.status})`, jid: `${to}@s.whatsapp.net` };
    }
    return { ok: true, message: "انرسلت من نظام إشعارات المنصة.", jid: `${to}@s.whatsapp.net` };
  } catch {
    return { ok: false, message: "ما قدرنا نتصل بنظام إشعارات المنصة." };
  }
}
