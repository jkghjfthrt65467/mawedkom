"use client";

import { BookingWizard } from "@/components/BookingWizard";
import { ContactIcons } from "@/components/ContactIcons";
import { cityBySlug } from "@/lib/data";
import { initialsFromName } from "@/lib/availability";
import { businessAvatar } from "@/lib/contact";
import { useLiveBusiness } from "@/lib/live-business";
import type { Business } from "@/lib/types";

export function BookClient({
  initial,
  presetService,
  presetStaff,
  manageToken,
}: {
  initial: Business;
  presetService?: string;
  presetStaff?: string;
  manageToken?: string;
}) {
  const b = useLiveBusiness(initial);
  const city = cityBySlug(b.city)?.name;
  const place = [b.district, city].filter(Boolean).join("، ");
  const avatar = businessAvatar(b);
  return (
    <div>
      <header className="sticky top-0 z-40 border-b border-line bg-canvas">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-palm-soft text-sm font-bold text-palm">
              {initialsFromName(b.name)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold leading-6">{b.name}</p>
            {place && <p className="truncate text-xs text-muted">{place}</p>}
          </div>
          <ContactIcons business={b} compact />
        </div>
      </header>
      <div className="mx-auto max-w-lg px-4 py-6">
        <BookingWizard business={b} presetService={presetService} presetStaff={presetStaff} manageToken={manageToken} bare />
      </div>
    </div>
  );
}
