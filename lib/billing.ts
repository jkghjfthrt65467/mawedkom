import { toLatinDigits } from "./latin-digits";
import { monthKey, planOf, resolveNotifyChannel } from "./plans";
import type { Business } from "./types";

export const META_BOOKING_USD = 0.05;
export const META_MONTHLY_MIN_USD = 10;

export function roundUsd(n: number) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function walletOf(business: Pick<Business, "metaWalletUsd">) {
  return roundUsd(business.metaWalletUsd || 0);
}

export function rollMetaMonth(business: Business, now = new Date()): Business {
  const plan = planOf(business);
  const current = monthKey(now);
  const prev = business.metaMonthKey;
  let wallet = walletOf(business);
  let monthBookings = prev === current ? business.metaMonthBookings || 0 : 0;
  let feeCharged = business.metaMinChargedMonth;
  if (plan.id === "meta_usage" && feeCharged !== current) {
    wallet = roundUsd(wallet - (plan.priceUsd || plan.monthlyMinUsd || META_MONTHLY_MIN_USD));
    feeCharged = current;
  }

  return {
    ...business,
    metaWalletUsd: wallet,
    metaMonthKey: current,
    metaMonthBookings: monthBookings,
    metaMinChargedMonth: feeCharged,
  };
}

export function prepareMetaBookingCharge(
  business: Business,
  now = new Date(),
): { business: Business; chargeUsd: number; error?: string } {
  const rolled = rollMetaMonth(business, now);
  const plan = planOf(rolled);
  if (plan.perBookingUsd <= 0 || resolveNotifyChannel(rolled) !== "meta") {
    return { business: rolled, chargeUsd: 0 };
  }
  const cost = plan.perBookingUsd;
  if (walletOf(rolled) + 1e-9 < cost) {
    return {
      business: rolled,
      chargeUsd: 0,
      error: `رصيد إشعارات المنصة ما يكفي. الاشتراك 10$ بالشهر، وكل حجز ${toLatinDigits(cost.toLocaleString("en-US", { minimumFractionDigits: 2 }))}$. اشحن حسابك من الخطة.`,
    };
  }
  return {
    business: {
      ...rolled,
      metaWalletUsd: roundUsd(walletOf(rolled) - cost),
      metaMonthBookings: (rolled.metaMonthBookings || 0) + 1,
    },
    chargeUsd: cost,
  };
}

export function topUpWallet(business: Business, amount: number): Business {
  const add = Math.max(0, roundUsd(amount));
  const rolled = rollMetaMonth(business);
  return { ...rolled, metaWalletUsd: roundUsd(walletOf(rolled) + add) };
}
