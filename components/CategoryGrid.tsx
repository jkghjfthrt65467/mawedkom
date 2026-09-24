"use client";

import Link from "next/link";
import { useT } from "@/components/LocaleProvider";
import { CATEGORIES } from "@/lib/data";
import { categoryBlurb, categoryLabel } from "@/lib/i18n";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

const GROUPS = [
  { key: "beauty", slugs: ["salon", "barber", "beauty", "nails", "laser"] },
  { key: "health", slugs: ["clinic", "doctor", "psychology", "physio", "vet"] },
  { key: "services", slugs: ["fitness", "carwash", "petgroom", "home"] },
] as const;

export function CategoryGrid({
  hrefFor,
  showBlurb = false,
}: {
  hrefFor?: (slug: string) => string;
  showBlurb?: boolean;
}) {
  const t = useT();
  return (
    <div className="space-y-8">
      {GROUPS.map((group) => (
        <div key={group.key}>
          <p className="mb-3 text-sm font-semibold text-muted">{t(`catGroup.${group.key}`)}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {group.slugs.map((slug) => {
              const category = CATEGORIES.find((item) => item.slug === slug);
              if (!category) return null;
              return (
                <Link
                  key={slug}
                  href={hrefFor?.(slug) ?? `/c/${slug}`}
                  className="nubo-card nubo-select-card flex flex-col items-center px-3 py-5 text-center"
                >
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-palm text-white shadow-[0_10px_20px_-12px_rgba(255,120,2,0.85)]">
                    <CategoryIcon slug={slug} size={30} className="h-[30px] w-[30px]" />
                  </span>
                  <p className="mt-3 text-sm font-bold leading-6">{categoryLabel(t.locale, slug)}</p>
                  {showBlurb ? <p className="mt-1 line-clamp-2 text-xs leading-6 text-muted">{categoryBlurb(t.locale, slug)}</p> : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
