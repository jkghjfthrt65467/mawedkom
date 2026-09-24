import { publicCatalog } from "@/lib/business-server";
import { CATEGORIES, CITIES, categoryBySlug, cityBySlug, filterBusinesses } from "@/lib/data";
import { publicMeta } from "@/lib/seo";
import { Listing } from "../../../salons/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return CATEGORIES.flatMap((cat) => CITIES.map((city) => ({ category: cat.slug, city: city.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; city: string }>;
}): Promise<Metadata> {
  const { category, city } = await params;
  const cat = categoryBySlug(category);
  const c = cityBySlug(city);
  if (!cat || !c) return { title: "غير موجود" };
  return publicMeta({
    title: `${cat.name} في ${c.name}`,
    description: `احجز ${cat.name} في ${c.name} من موعدكم. ${cat.blurb}`,
    path: `/c/${cat.slug}/${c.slug}`,
  });
}

export default async function CategoryCityPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string; city: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { category, city } = await params;
  const { q } = await searchParams;
  const cat = categoryBySlug(category);
  const c = cityBySlug(city);
  if (!cat || !c) notFound();
  const list = filterBusinesses(await publicCatalog(), { category, city, q });
  return (
    <Listing
      title={`${cat.name} في ${c.name}`}
      subtitle={`${list.length} نتيجة`}
      list={list}
      category={category}
      city={city}
      q={q}
      path={`/c/${category}/${city}`}
    />
  );
}
