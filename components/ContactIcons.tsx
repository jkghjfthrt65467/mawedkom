import { Icon } from "@/components/ui/Icon";
import { businessMapHref, businessWaHref, iraqTelHref } from "@/lib/contact";
import type { Business } from "@/lib/types";

export function ContactIcons({
  business,
  compact = false,
}: {
  business: Business;
  compact?: boolean;
}) {
  const tel = iraqTelHref(business.phone);
  const wa = businessWaHref(business);
  const map = businessMapHref(business);
  const box = compact ? "h-10 w-10" : "h-11 w-11";
  const glyph = compact ? "h-[18px] w-[18px]" : "h-5 w-5";
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {tel && (
        <a href={tel} className={`grid ${box} place-items-center rounded-full bg-palm-soft text-palm`} aria-label={`اتصال ${business.name}`}>
          <Icon name="phone" className={glyph} />
        </a>
      )}
      {wa && (
        <a href={wa} className={`grid ${box} place-items-center rounded-full bg-palm-soft text-palm`} target="_blank" rel="noreferrer" aria-label="واتساب">
          <Icon name="whatsapp" className={glyph} />
        </a>
      )}
      <a
        href={map}
        className={`grid ${box} place-items-center rounded-full bg-palm-soft text-palm`}
        target={map.startsWith("http") ? "_blank" : undefined}
        rel={map.startsWith("http") ? "noreferrer" : undefined}
        aria-label="موقع المشروع"
      >
        <Icon name="map" className={glyph} />
      </a>
    </div>
  );
}
