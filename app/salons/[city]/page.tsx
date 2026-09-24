import { publicCatalog } from "@/lib/business-server";
import { CITIES, cityBySlug, filterBusinesses } from "@/lib/data";
import { publicMeta } from "@/lib/seo";
import { Listing } from "@/components/Listing";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const c = cityBySlug(city);
  if (!c) return { title: "غير موجود" };
  return publicMeta({
    title: `حجز مواعيد في ${c.name}`,
    description: `احجز عيادة أو صالون أو حلاقة في ${c.name} من موعدكم. شوف الساعات والأسعار واحجز أونلاين بدون تطبيق.`,
    path: `/salons/${c.slug}`,
  });
}

export default async function CityPage({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { city } = await params;
  const { q } = await searchParams;
  const c = cityBySlug(city);
  if (!c) notFound();
  const list = filterBusinesses(await publicCatalog(), { city, q });
  return (
    <Listing
      title={`أعمال ${c.name}`}
      subtitle={`${list.length} نتيجة في ${c.name}`}
      list={list}
      city={city}
      q={q}
      path={`/salons/${city}`}
    />
  );
}
