import { CATEGORIES, CITIES, categoryBySlug, cityBySlug } from "@/lib/data";
import { categoryLabel, cityLabel, type Locale } from "@/lib/i18n";
import { foldQuery, includesFold } from "@/lib/search-text";
import type { Business } from "@/lib/types";

export { foldQuery, includesFold } from "@/lib/search-text";

export function businessSearchText(b: Business, locale: Locale = "ar") {
  const city = cityBySlug(b.city);
  const cat = categoryBySlug(b.category);
  return [
    b.name,
    b.district,
    b.address,
    b.about,
    city?.name,
    city?.nameEn,
    cityLabel("ar", b.city),
    cityLabel("ckb", b.city),
    cityLabel(locale, b.city),
    cat?.name,
    cat?.nameEn,
    categoryLabel("ar", b.category),
    categoryLabel("ckb", b.category),
    categoryLabel(locale, b.category),
    ...(b.services || []).map((s) => s.name),
    ...(b.staff || []).flatMap((s) => [s.name, s.role]),
  ]
    .filter(Boolean)
    .join(" ");
}

export function matchesBusinessQuery(b: Business, q: string, locale: Locale = "ar") {
  return includesFold(businessSearchText(b, locale), q);
}

export type SearchSuggestion = {
  id: string;
  kind: "place" | "city" | "category" | "service";
  href: string;
  title: string;
  hint: string;
};

export function suggestSearch(
  list: Business[],
  opts: { q: string; city?: string; category?: string; locale: Locale },
  limit = 8,
): SearchSuggestion[] {
  const q = foldQuery(opts.q);
  if (q.length < 1) return [];
  const out: SearchSuggestion[] = [];

  for (const city of CITIES) {
    const title = cityLabel(opts.locale, city.slug);
    const hay = `${city.name} ${city.nameEn} ${title} ${cityLabel("ar", city.slug)} ${cityLabel("ckb", city.slug)}`;
    if (!includesFold(hay, q)) continue;
    out.push({
      id: `city-${city.slug}`,
      kind: "city",
      href: opts.category ? `/c/${opts.category}/${city.slug}` : `/salons/${city.slug}`,
      title,
      hint: city.nameEn,
    });
  }

  for (const cat of CATEGORIES) {
    const title = categoryLabel(opts.locale, cat.slug);
    const hay = `${cat.name} ${cat.nameEn} ${title} ${categoryLabel("ar", cat.slug)} ${categoryLabel("ckb", cat.slug)} ${cat.blurb}`;
    if (!includesFold(hay, q)) continue;
    out.push({
      id: `cat-${cat.slug}`,
      kind: "category",
      href: opts.city ? `/c/${cat.slug}/${opts.city}` : `/c/${cat.slug}`,
      title,
      hint: cat.nameEn,
    });
  }

  const places = list.filter((b) => {
    if (opts.city && b.city !== opts.city) return false;
    if (opts.category && b.category !== opts.category) return false;
    return matchesBusinessQuery(b, opts.q, opts.locale);
  });

  for (const b of places) {
    const city = cityBySlug(b.city);
    out.push({
      id: `place-${b.slug}`,
      kind: "place",
      href: `/salon/${b.slug}`,
      title: b.name,
      hint: `${b.district}${city ? `، ${cityLabel(opts.locale, city.slug)}` : ""}`,
    });
    for (const service of b.services || []) {
      if (!includesFold(service.name, opts.q)) continue;
      out.push({
        id: `svc-${b.slug}-${service.id}`,
        kind: "service",
        href: `/book/${b.slug}?service=${encodeURIComponent(service.id)}`,
        title: service.name,
        hint: b.name,
      });
    }
  }

  const rank = { city: 0, category: 1, place: 2, service: 3 };
  return out
    .sort((a, b) => rank[a.kind] - rank[b.kind] || a.title.localeCompare(b.title, "ar"))
    .slice(0, limit);
}
