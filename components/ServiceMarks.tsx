import { isOnOffer } from "@/lib/services";
import { formatIqd } from "@/lib/data";
import type { Service } from "@/lib/types";

export function ServiceTags({ s }: { s: Service }) {
  return (
    <span className="mt-1 flex flex-wrap gap-1">
      {s.popular && <span className="nubo-tag nubo-tag-hot">الأكثر طلباً</span>}
      {isOnOffer(s) && <span className="nubo-tag nubo-tag-offer">عرض</span>}
      {typeof s.sessionCount === "number" && s.sessionCount > 1 && (
        <span className="nubo-tag">{s.sessionCount} جلسات</span>
      )}
    </span>
  );
}

export function ServicePrice({ s, className = "" }: { s: Service; className?: string }) {
  if (isOnOffer(s) && s.offerPriceIqd != null) {
    return (
      <span className={`grid justify-items-end ${className}`}>
        <span className="text-xs text-muted line-through">{formatIqd(s.priceIqd)}</span>
        <span className="font-bold text-palm">{formatIqd(s.offerPriceIqd)}</span>
      </span>
    );
  }
  return <span className={`font-bold text-palm ${className}`}>{formatIqd(s.priceIqd)}</span>;
}
