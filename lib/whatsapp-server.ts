import { parseLocale } from "./i18n";
import { getManagedBusinessFromDisk } from "./business-server";
import {
  buildBookingCreatedMessage,
  buildBookingReminderMessage,
  buildOwnerNewBookingMessage,
  buildStaffNewBookingMessage,
  buildWaitlistFreedMessage,
} from "./booking-message";
import { manageAppointmentUrl, teamCalendarUrl } from "./booking-token";
import { iraqPhoneKey } from "./contact";
import { resolveNotifyChannel } from "./plans";
import { getSalonSettings, resolveOwnerNotifyPhone } from "./salon-server";
import type { BookingRecord, Business } from "./types";
import { WA_GATEWAY } from "./wa-gateway";
import { enqueueOwnerMessage, type OutboxKind } from "./wa-outbox";
import { sendMetaWhatsApp } from "./whatsapp-meta";

export type GatewaySendResult = {
  ok: boolean;
  skipped?: boolean;
  message: string;
  jid?: string;
};

export async function sendViaBusinessChannel(
  business: Pick<Business, "slug" | "planId" | "notifyChannel"> | null | undefined,
  phone: string,
  text: string,
  kind: OutboxKind = "other",
): Promise<GatewaySendResult> {
  if (business && resolveNotifyChannel(business) === "meta") {
    return sendMetaWhatsApp(phone, text);
  }
  if (business?.slug) {
    const queued = await enqueueOwnerMessage({ slug: business.slug, phone, text, kind });
    if (queued) {
      return {
        ok: true,
        message: "الرسالة بالانتظار على تطبيق أندرويد صاحب المشروع. تنرسل من جهازه لما يصير عنده نت.",
        jid: `${queued.phone}@s.whatsapp.net`,
      };
    }
  }
  return { ok: false, skipped: true, message: "ما قدرنا نعلّق الرسالة لجهاز المدير." };
}

export async function gatewaySend(phone: string, text: string): Promise<GatewaySendResult> {
  const trimmedPhone = (phone || "").trim();
  const trimmedText = (text || "").trim();
  if (!trimmedPhone) return { ok: false, skipped: true, message: "الرقم ناقص." };
  if (!trimmedText) return { ok: false, skipped: true, message: "نص الرسالة ناقص." };
  try {
    const res = await fetch(`${WA_GATEWAY}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: trimmedPhone, text: trimmedText }),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      jid?: string;
    };
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        message: data.error || `فشل الإرسال (${res.status})`,
        jid: data.jid,
      };
    }
    return { ok: true, message: "انرسلت من واتساب المربوط.", jid: data.jid };
  } catch {
    return { ok: false, message: "بوابة واتساب مو شغّالة. من الطرفية: npm run wa" };
  }
}

export async function notifyNewBookingOnServer(
  rec: BookingRecord,
  opts?: { ownerNotifyPhone?: string; baseUrl?: string },
): Promise<{ customer: GatewaySendResult; owner: GatewaySendResult; staff: GatewaySendResult }> {
  const manageUrl = manageAppointmentUrl(rec.manageToken, opts?.baseUrl);
  const ownerCalendar = teamCalendarUrl("owner", rec, opts?.baseUrl);
  const staffCalendar = teamCalendarUrl("staff", rec, opts?.baseUrl);
  const salon = await getSalonSettings(rec.businessSlug);
  const ownerPhone = (opts?.ownerNotifyPhone || "").trim() || resolveOwnerNotifyPhone(salon);
  const biz = await getManagedBusinessFromDisk(rec.businessSlug);
  const teamLocale = parseLocale(biz?.locale || rec.locale);
  const send = (phone: string, text: string, kind: OutboxKind) => sendViaBusinessChannel(biz, phone, text, kind);
  const customer = rec.customerPhone
    ? await send(rec.customerPhone, buildBookingCreatedMessage(rec, manageUrl), "customer")
    : { ok: false, skipped: true, message: "رقم الزبون ناقص." };
  const owner = ownerPhone
    ? await send(ownerPhone, buildOwnerNewBookingMessage(rec, ownerCalendar, teamLocale), "owner")
    : { ok: false, skipped: true, message: "رقم صاحب المشروع ناقص." };
  const assigned = biz?.staff.find((s) => s.id === rec.staffId || s.name === rec.staffName);
  const staffPhone = (assigned?.phone || "").trim();
  const sameAsOwner = staffPhone && ownerPhone && iraqPhoneKey(staffPhone) === iraqPhoneKey(ownerPhone);
  const staffOff = biz?.staffWhatsAppEnabled === false;
  const staff = staffOff
    ? { ok: true, skipped: true, message: "إشعار الموظف على واتساب مطفي." }
    : !staffPhone
      ? { ok: false, skipped: true, message: "رقم الموظف ناقص." }
      : sameAsOwner
        ? { ok: true, skipped: true, message: "رقم الموظف نفس رقم المدير." }
        : await send(staffPhone, buildStaffNewBookingMessage(rec, staffCalendar, teamLocale), "staff");

  return { customer, owner, staff };
}

export async function notifyWaitlistFreedOnServer(input: {
  businessName: string;
  date: string;
  time: string;
  phone: string;
  bookUrl: string;
  businessSlug?: string;
}): Promise<GatewaySendResult> {
  const biz = input.businessSlug ? await getManagedBusinessFromDisk(input.businessSlug) : null;
  return sendViaBusinessChannel(
    biz,
    input.phone,
    buildWaitlistFreedMessage({
      businessName: input.businessName,
      date: input.date,
      time: input.time,
      bookUrl: input.bookUrl,
    }),
    "waitlist",
  );
}

export async function sendReminderOnServer(
  rec: BookingRecord,
  opts?: { baseUrl?: string; lead?: "1h" | "24h" },
): Promise<GatewaySendResult> {
  const manageUrl = manageAppointmentUrl(rec.manageToken, opts?.baseUrl);
  if (!rec.customerPhone) return { ok: false, skipped: true, message: "رقم الزبون ناقص." };
  const biz = await getManagedBusinessFromDisk(rec.businessSlug);
  return sendViaBusinessChannel(biz, rec.customerPhone, buildBookingReminderMessage(rec, manageUrl, opts?.lead || "1h"), "reminder");
}
