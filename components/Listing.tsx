import { SearchBar } from "@/components/SearchBar";
import { SalonCard } from "@/components/SalonCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { CATEGORIES, CITIES, cityBySlug, categoryBySlug } from "@/lib/data";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import type { Business } from "@/lib/types";
import Link from "next/link";

export function Listing({
  title,
  subtitle,
  list,
  city,
  category,
  q,
  path = "/salons",
}: {
  title: string;
  subtitle: string;
  list: Business[];
  city?: string;
  category?: string;
  q?: string;
  path?: string;
}) {
  const crumbs = [{ name: "الرئيسية", path: "/" }, { name: title, path }];
  return (
    <div className="space-y-6">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd
        data={itemListJsonLd(list.slice(0, 24).map((b) => ({ name: b.name, path: `/salon/${b.slug}` })))}
      />
      <nav className="text-sm text-muted">
        <Link href="/">الرئيسية</Link> / <span className="text-ink">{title}</span>
      </nav>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-muted">{subtitle}</p>
      <SearchBar initialCity={city} initialCategory={category} initialQ={q} compact />
      <div className="sticky top-[4.25rem] z-20 -mx-4 space-y-2 bg-canvas/85 px-4 py-3 backdrop-blur-xl md:static md:mx-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={city ? `/c/${c.slug}/${city}` : `/c/${c.slug}`}
              className={`nubo-chip inline-flex items-center gap-1.5 ${category === c.slug ? "nubo-chip-on" : ""}`}
            >
              <CategoryIcon slug={c.slug} size={16} className="h-4 w-4" />
              {c.name}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {CITIES.map((c) => (
            <Link
              key={c.slug}
              href={category ? `/c/${category}/${c.slug}` : `/salons/${c.slug}`}
              className={`nubo-chip ${city === c.slug ? "nubo-chip-on" : ""}`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>
      {list.length === 0 ? (
        <div className="nubo-card nubo-empty">
          <p className="font-bold">ماكو نتائج بهالفلتر</p>
          <p className="mt-2 text-sm text-muted">غيّر المدينة أو التصنيف، أو امسح البحث.</p>
          <Link href="/salons" className="nubo-btn nubo-btn-primary mt-4">
            عرض الكل
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((b) => (
            <SalonCard key={b.slug} b={b} />
          ))}
        </div>
      )}
      <p className="text-sm leading-7 text-muted">
        موعدكم يجمع كل مجالات الموعد من {cityBySlug(city || "")?.name || "كل العراق"}. اختار الخدمة، شوف التقييم، واحجز
        أونلاين.
        {category ? ` تصنيف الصفحة: ${categoryBySlug(category)?.name}.` : ""}
      </p>
    </div>
  );
}
