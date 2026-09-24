import { isoInBaghdad } from "./calendar";
import { t, type Locale } from "./i18n";
import { toLatinDigits } from "./latin-digits";
import type { BookingRecord, BookingStatus, Business, NotifyChannel, PlanId } from "./types";

export type PlanFamily = "owner" | "meta";

export type Plan = {
  id: PlanId;
  name: string;
  blurb: string;
  priceUsd: number;
  staffLimit: number | null;
  bookingsPerMonth: number | null;
  family: PlanFamily;
  channel: "owner" | "meta" | "both";
  perBookingUsd: number;
  monthlyMinUsd: number;
  featured?: boolean;
};

const PLAN_ALIASES: Record<string, PlanId> = {
  starter: "own_1",
  growth: "own_3",
  pro: "own_unlimited",
  unlimited: "own_unlimited",
};

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "مجاني",
    blurb: "تجربة مرة واحدة لمدة 30 يوم: موظف واحد و100 حجز، ورسائل من رقمك أو من نظام إشعارات المنصة.",
    priceUsd: 0,
    staffLimit: 1,
    bookingsPerMonth: 100,
    family: "owner",
    channel: "both",
    perBookingUsd: 0,
    monthlyMinUsd: 0,
  },
  {
    id: "own_1",
    name: "رقمك · موظف",
    blurb: "موظف واحد. كل الإشعارات من واتسابك المربوط.",
    priceUsd: 5,
    staffLimit: 1,
    bookingsPerMonth: null,
    family: "owner",
    channel: "owner",
    perBookingUsd: 0,
    monthlyMinUsd: 0,
  },
  {
    id: "own_3",
    name: "رقمك · 3 موظفين",
    blurb: "ثلاثة موظفين. التأكيد والتذكير من رقمك.",
    priceUsd: 10,
    staffLimit: 3,
    bookingsPerMonth: null,
    family: "owner",
    channel: "owner",
    perBookingUsd: 0,
    monthlyMinUsd: 0,
    featured: true,
  },
  {
    id: "own_unlimited",
    name: "رقمك · مفتوح",
    blurb: "موظفين بلا حدود. الرسائل تطلع من واتسابك.",
    priceUsd: 20,
    staffLimit: null,
    bookingsPerMonth: null,
    family: "owner",
    channel: "owner",
    perBookingUsd: 0,
    monthlyMinUsd: 0,
  },
  {
    id: "meta_usage",
    name: "إشعارات المنصة",
    blurb: "موظفين مفتوح. الرسائل من نظام إشعارات المنصة: 10$ بالشهر + تكلفة كل حجز.",
    priceUsd: 10,
    staffLimit: null,
    bookingsPerMonth: null,
    family: "meta",
    channel: "meta",
    perBookingUsd: 0.05,
    monthlyMinUsd: 10,
  },
];

export function normalizePlanId(value: unknown): PlanId | null {
  if (typeof value !== "string") return null;
  if (PLANS.some((p) => p.id === value)) return value as PlanId;
  return PLAN_ALIASES[value] || null;
}

export function isPlanId(value: unknown): value is PlanId {
  return normalizePlanId(value) != null;
}

export function planOf(business: Pick<Business, "planId">): Plan {
  const id = normalizePlanId(business.planId);
  if (!id) return PLANS[0];
  return PLANS.find((p) => p.id === id) || PLANS[0];
}

export function staffLimitLabel(plan: Plan, locale: Locale = "ar") {
  if (plan.staffLimit == null) return t(locale, "plan.staffUnlimited");
  if (plan.staffLimit === 1) return t(locale, "plan.staffOne");
  return t(locale, "plan.staffN", { n: plan.staffLimit });
}

export function bookingLimitLabel(plan: Plan, locale: Locale = "ar") {
  if (plan.perBookingUsd > 0) return t(locale, "plan.bookPerUse", { n: plan.perBookingUsd });
  return plan.bookingsPerMonth == null ? t(locale, "plan.bookOpen") : t(locale, "plan.bookN", { n: plan.bookingsPerMonth });
}

export function canAddStaff(business: Pick<Business, "planId" | "staff">) {
  const limit = planOf(business).staffLimit;
  if (limit == null) return true;
  return (business.staff || []).length < limit;
}

export function monthKey(date = new Date()) {
  return isoInBaghdad(date).slice(0, 7);
}

export function countsTowardQuota(status: BookingStatus | undefined) {
  return status !== "cancelled";
}

export function monthBookingCount(rows: BookingRecord[], slug: string, now = new Date()) {
  const key = monthKey(now);
  return rows.filter((b) => b.businessSlug === slug && (b.date || "").startsWith(key) && countsTowardQuota(b.status)).length;
}

export function quotaReached(business: Pick<Business, "planId">, used: number) {
  const cap = planOf(business).bookingsPerMonth;
  if (cap == null) return false;
  return used >= cap;
}

export function quotaMessage(plan: Plan) {
  if (plan.bookingsPerMonth == null) return "";
  return `هالخطة تسمح بـ ${plan.bookingsPerMonth} حجز بهالشهر. رقّي الخطة حتى تستقبل أكثر.`;
}

export function resolveNotifyChannel(business: Pick<Business, "planId" | "notifyChannel">): NotifyChannel {
  const plan = planOf(business);
  if (plan.channel === "meta") return "meta";
  if (plan.channel === "owner") return "owner";
  return business.notifyChannel === "meta" ? "meta" : "owner";
}

export function channelForPlan(plan: Plan): NotifyChannel {
  return plan.channel === "meta" ? "meta" : "owner";
}

export function formatUsd(amount: number) {
  const n = Number.isFinite(amount) ? amount : 0;
  const digits = Math.abs(n % 1) > 1e-9 ? 2 : 0;
  return `${toLatinDigits(n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: 2 }))}$`;
}

export const FREE_TRIAL_DAYS = 30;
const FREE_TRIAL_MS = FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000;

type FreeClock = Pick<Business, "planId" | "freeStartedAt" | "freeUsed">;

export function isFreePlan(business: Pick<Business, "planId">) {
  return (normalizePlanId(business.planId) || "free") === "free";
}

export function freeTrialEndsAt(startedAt?: string) {
  if (!startedAt) return null;
  const start = Date.parse(startedAt);
  if (Number.isNaN(start)) return null;
  return start + FREE_TRIAL_MS;
}

export function freeTrialDaysLeft(business: FreeClock, now = Date.now()) {
  const end = freeTrialEndsAt(business.freeStartedAt);
  if (end == null) return isFreePlan(business) ? FREE_TRIAL_DAYS : 0;
  return Math.max(0, Math.ceil((end - now) / (24 * 60 * 60 * 1000)));
}

export function freeTrialExpired(business: FreeClock, now = Date.now()) {
  if (!isFreePlan(business)) return false;
  const end = freeTrialEndsAt(business.freeStartedAt);
  return end != null && now >= end;
}

export function canActivateFree(business?: FreeClock | null) {
  if (!business) return true;
  if (isFreePlan(business) && !freeTrialExpired(business)) return true;
  if (business.freeUsed || business.freeStartedAt) return false;
  return true;
}

export function freeTrialMessage(business: FreeClock) {
  if (freeTrialExpired(business)) {
    return "انتهت التجربة المجانية (30 يوم مرة واحدة). رقّي خطتك حتى تستقبل حجوزات.";
  }
  if (!isFreePlan(business)) return "";
  const days = freeTrialDaysLeft(business);
  return days === 1 ? "باقي يوم واحد على نهاية التجربة المجانية." : `باقي ${days} يوم على نهاية التجربة المجانية.`;
}

export function ensureFreeTrial(business: Business, now = new Date()): Business {
  if (!isFreePlan(business)) return { ...business, freeUsed: Boolean(business.freeUsed || business.freeStartedAt) };
  if (!business.freeStartedAt) {
    return { ...business, freeStartedAt: now.toISOString(), freeUsed: false };
  }
  if (freeTrialExpired(business, now.getTime())) {
    return { ...business, freeUsed: true };
  }
  return business;
}

/** Support/admin can reset the one-time trial clock when activating free. */
export function applyAdminPlanChange(business: Business, nextId: PlanId, now = new Date()): { business: Business; error?: string } {
  const next = normalizePlanId(nextId);
  if (!next) return { business, error: "خطة غير معروفة." };
  if (next === "free") {
    return {
      business: {
        ...business,
        planId: "free",
        notifyChannel: business.notifyChannel || "owner",
        freeStartedAt: now.toISOString(),
        freeUsed: false,
        requestedPlanId: "free",
      },
    };
  }
  return applyPlanChange({ ...business, freeUsed: true }, next, now);
}

export function applyPlanChange(business: Business, nextId: PlanId, now = new Date()): { business: Business; error?: string } {
  const next = normalizePlanId(nextId);
  if (!next) return { business, error: "خطة غير معروفة." };
  const current = normalizePlanId(business.planId) || "free";
  if (next === current) return { business: ensureFreeTrial(business, now) };

  if (next === "free") {
    if (!canActivateFree(business)) {
      return { business, error: "العرض المجاني مرة واحدة ولمدة 30 يوم فقط." };
    }
    return {
      business: {
        ...business,
        planId: "free",
        notifyChannel: business.notifyChannel || "owner",
        freeStartedAt: business.freeStartedAt || now.toISOString(),
        freeUsed: false,
      },
    };
  }

  return {
    business: {
      ...business,
      planId: next,
      notifyChannel: channelForPlan(planOf({ planId: next })),
      freeUsed: true,
    },
  };
}

export function planBlocksNewBookings(business: FreeClock) {
  if (freeTrialExpired(business)) return freeTrialMessage(business);
  return "";
}
