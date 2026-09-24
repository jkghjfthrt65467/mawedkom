"use client";

import {
  buildBookingCancelledMessage,
  buildBookingCreatedMessage,
  buildOwnerNewBookingMessage,
} from "./booking-message";
import { manageAppointmentUrl, teamCalendarUrl } from "./booking-token";
import { showToast } from "./toast";
import { toWhatsAppJid } from "./phone-wa";
import type { BookingRecord } from "./types";

const LAST_SEND_KEY = "nubo-wa-last";

export type WhatsAppLastSend = {
  at: string;
  ok: boolean;
  action: "test" | "booking" | "cancel" | "owner" | "staff" | "reminder";
  jid: string;
  message: string;
};

export { normalizeIraqWhatsApp, toWhatsAppJid } from "./phone-wa";

export function getLastWhatsAppSend(): WhatsAppLastSend | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_SEND_KEY);
    return raw ? (JSON.parse(raw) as WhatsAppLastSend) : null;
  } catch {
    return null;
  }
}

function writeLastSend(entry: WhatsAppLastSend) {
  localStorage.setItem(LAST_SEND_KEY, JSON.stringify(entry));
}

type SendResult = { ok: boolean; skipped?: boolean; message: string; jid?: string };

async function postSend(phone: string, text: string): Promise<{ ok: boolean; message: string; jid?: string }> {
  const jid = toWhatsAppJid(phone);
  const res = await fetch("/api/whatsapp/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, text }),
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; jid?: string };
  const resolvedJid = data.jid || jid;
  if (!res.ok || !data.ok) {
    return { ok: false, message: data.error || `فشل الإرسال (${res.status})`, jid: resolvedJid };
  }
  return { ok: true, message: "انرسلت من واتساب المربوط.", jid: resolvedJid };
}

async function sendToCustomer(
  phone: string,
  text: string,
  action: WhatsAppLastSend["action"],
): Promise<SendResult> {
  const jid = toWhatsAppJid(phone);
  if (!jid) return { ok: false, skipped: true, message: action === "owner" ? "رقم صاحب المشروع ناقص." : "رقم الزبون ناقص." };
  try {
    const result = await postSend(phone, text);
    writeLastSend({
      at: new Date().toISOString(),
      ok: result.ok,
      action,
      jid: result.jid || jid,
      message: result.message,
    });
    if (!result.ok) console.warn("[nubo-wa]", action, "fail", result.jid || jid, result.message);
    else console.info("[nubo-wa]", action, "ok", result.jid || jid);
    return result;
  } catch {
    const message = "ما قدرنا نتصل ببوابة واتساب.";
    writeLastSend({ at: new Date().toISOString(), ok: false, action, jid, message });
    console.warn("[nubo-wa]", action, "fail", jid, message);
    return { ok: false, message, jid };
  }
}

export function bookingCreatedWhatsAppText(rec: BookingRecord, baseUrl?: string): string {
  return buildBookingCreatedMessage(rec, manageAppointmentUrl(rec.manageToken, baseUrl));
}

export function ownerNewBookingWhatsAppText(rec: BookingRecord, baseUrl?: string): string {
  return buildOwnerNewBookingMessage(rec, teamCalendarUrl("owner", rec, baseUrl));
}

function toastNewBooking(customer: SendResult, owner: SendResult) {
  if (customer.ok && owner.ok) {
    showToast("تأكيد الموعد وإشعار صاحب المشروع انرسلوا واتساب.", "ok");
    return;
  }
  if (customer.ok && (owner.ok || owner.skipped)) {
    showToast(owner.skipped ? "تأكيد الموعد انرسل واتساب للزبون." : `تأكيد الزبون انرسل. إشعار المدير: ${owner.message}`, owner.skipped ? "ok" : "ok");
    return;
  }
  if (owner.ok && !customer.ok) {
    showToast(`إشعار المدير انرسل. الزبون: ${customer.message}`, "ok");
    return;
  }
  showToast(`الحجز انحفظ. واتساب: ${customer.message || owner.message}`, "err");
}

function asSendResult(r: { ok?: boolean; skipped?: boolean; message?: string; jid?: string }): SendResult {
  return { ok: Boolean(r.ok), skipped: r.skipped, message: r.message || "", jid: r.jid };
}

export async function notifyBookingConfirmed(
  rec: BookingRecord,
  opts?: {
    ownerPhone?: string;
    serverWhatsApp?: {
      customer?: { ok?: boolean; skipped?: boolean; message?: string; jid?: string };
      owner?: { ok?: boolean; skipped?: boolean; message?: string; jid?: string };
    };
  },
): Promise<{ customer: SendResult; owner: SendResult }> {
  const ownerPhone = (opts?.ownerPhone || "").trim();
  const serverAttempted = Boolean(opts?.serverWhatsApp);
  let customer = opts?.serverWhatsApp?.customer;
  let owner = opts?.serverWhatsApp?.owner;

  if (!serverAttempted && !customer) {
    customer = await sendToCustomer(rec.customerPhone, bookingCreatedWhatsAppText(rec), "booking");
  }
  if (!serverAttempted && !owner) {
    if (!ownerPhone) {
      owner = { ok: false, skipped: true, message: "رقم صاحب المشروع ناقص." };
    } else {
      owner = await sendToCustomer(ownerPhone, ownerNewBookingWhatsAppText(rec), "owner");
    }
  }

  const customerResult = asSendResult(customer || { ok: false, skipped: true, message: "ما انرسل تأكيد للزبون." });
  const ownerResult = asSendResult(owner || { ok: false, skipped: true, message: "ما انرسل إشعار لصاحب المشروع." });

  if (customerResult.skipped && ownerResult.skipped) return { customer: customerResult, owner: ownerResult };
  toastNewBooking(customerResult, ownerResult);
  return { customer: customerResult, owner: ownerResult };
}

export async function notifyBookingCancelled(rec: BookingRecord): Promise<SendResult> {
  const result = await sendToCustomer(rec.customerPhone, buildBookingCancelledMessage(rec), "cancel");
  if (result.skipped) return result;
  showToast(
    result.ok ? "رسالة الإلغاء انرسلت واتساب." : `الإلغاء انحفظ. واتساب: ${result.message}`,
    result.ok ? "ok" : "err",
  );
  return result;
}

export async function sendWhatsAppTest(phone: string): Promise<SendResult> {
  const result = await sendToCustomer(phone, "موعدكم تجربة: إذا وصلك هذا، الإرسال من رقمك المربوط شغال.", "test");
  if (result.skipped) {
    showToast(result.message, "err");
    return result;
  }
  showToast(result.ok ? "رسالة تجريبية انرسلت." : result.message, result.ok ? "ok" : "err");
  return result;
}
