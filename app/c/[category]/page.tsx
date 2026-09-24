import { publicCatalog } from "@/lib/business-server";
import { CATEGORIES, categoryBySlug, filterBusinesses } from "@/lib/data";
import { publicMeta } from "@/lib/seo";
import { Listing } from "@/components/Listing";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = categoryBySlug(category);
  if (!cat) return { title: "غير موجود" };
  return publicMeta({
    title: `${cat.name} — حجز مواعيد`,
    description: `${cat.blurb} احجز ${cat.name} بالعراق من موعدكم بدون تطبيق.`,
    path: `/c/${cat.slug}`,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { category } = await params;
  const { q } = await searchParams;
  const cat = categoryBySlug(category);
  if (!cat) notFound();
  const list = filterBusinesses(await publicCatalog(), { category, q });
  return (
    <Listing
      title={cat.name}
      subtitle={`${list.length} · ${cat.blurb}`}
      list={list}
      category={category}
      q={q}
      path={`/c/${category}`}
    />
  );
}
