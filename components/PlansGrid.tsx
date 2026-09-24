"use client";

import Link from "next/link";
import { useT } from "@/components/LocaleProvider";
import { bookingLimitLabel, canActivateFree, formatUsd, PLANS, staffLimitLabel, type Plan } from "@/lib/plans";
import type { Business } from "@/lib/types";
import { planBlurb, planName } from "@/lib/i18n";

function PlanCard({
  plan,
  current,
  requested,
  onPick,
  ctaHref,
  freeLocked,
}: {
  plan: Plan;
  current?: boolean;
  requested?: boolean;
  onPick?: (plan: Plan) => void;
  ctaHref: string;
  freeLocked?: boolean;
}) {
  const t = useT();
  const usage = plan.perBookingUsd > 0;
  const locked = plan.id === "free" && freeLocked && !current;
  return (
    <article
      className={`nubo-card flex h-full min-h-[28rem] flex-col p-5 ${plan.featured ? "border-palm/50" : ""} ${current ? "ring-2 ring-palm" : requested ? "ring-2 ring-gold/70" : ""} ${locked ? "opacity-70" : ""}`}
    >
      <p className="min-h-5 text-xs font-semibold text-gold">
        {requested && !current ? t("plan.requested") : plan.featured ? t("common.popular") : "\u00a0"}
      </p>
      <h3 className="mt-1 min-h-14 text-xl font-bold leading-7">{planName(t.locale, plan.id)}</h3>
      <div className="mt-2 min-h-[4.25rem]">
        <p className="text-3xl font-bold text-palm">
          {plan.priceUsd === 0 ? t("common.free") : formatUsd(plan.priceUsd)}
        </p>
        {usage ? (
          <p className="text-xs text-muted">
            {t("common.monthly")} + {formatUsd(plan.perBookingUsd)} {t("plan.perBooking")}
          </p>
        ) : plan.priceUsd === 0 ? (
          <p className="text-xs text-muted">{t("plan.freeOnce")}</p>
        ) : (
          <p className="text-xs text-muted">{t("common.monthly")}</p>
        )}
      </div>
      <p className="mt-3 min-h-[5.5rem] text-sm leading-7 text-muted">{planBlurb(t.locale, plan.id)}</p>
      <ul className="mt-3 min-h-[4.5rem] space-y-1 text-sm">
        <li>{staffLimitLabel(plan, t.locale)}</li>
        <li>{bookingLimitLabel(plan, t.locale)}</li>
        <li>{plan.family === "meta" ? t("plan.metaWa") : t("plan.ownWa")}</li>
      </ul>
      {onPick ? (
        <button
          type="button"
          className={`nubo-btn mt-auto ${current || requested ? "nubo-btn-ghost" : "nubo-btn-primary"}`}
          disabled={current || requested || locked}
          onClick={() => onPick(plan)}
        >
          {current
            ? t("plan.current")
            : requested
              ? t("plan.requested")
              : locked
                ? t("plan.freeUsed")
                : t("plan.request")}
        </button>
      ) : (
        <Link href={`${ctaHref}${ctaHref.includes("?") ? "&" : "?"}plan=${plan.id}`} className="nubo-btn nubo-btn-primary mt-auto">
          {plan.priceUsd === 0 ? t("plan.startFree") : t("plan.signupPlan")}
        </Link>
      )}
    </article>
  );
}

export function PlansGrid({
  currentId,
  requestedId,
  onPick,
  ctaHref = "/business/signup",
  business,
}: {
  currentId?: string;
  requestedId?: string;
  onPick?: (plan: Plan) => void;
  ctaHref?: string;
  business?: Business;
}) {
  const t = useT();
  const freeLocked = Boolean(business) && !canActivateFree(business);
  return (
    <div className="space-y-4">
      <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            current={currentId === plan.id}
            requested={Boolean(requestedId && requestedId === plan.id && requestedId !== currentId)}
            onPick={onPick}
            ctaHref={ctaHref}
            freeLocked={freeLocked}
          />
        ))}
      </div>
      <p className="text-sm leading-7 text-muted">{onPick ? t("plan.supportNote") : t("plan.familyMetaHelp")}</p>
    </div>
  );
}
