import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { SalonProfileView } from "@/components/SalonProfileView";
import { getPublicBusiness, publicCatalog } from "@/lib/business-server";
import { businessCover } from "@/lib/contact";
import { categoryBySlug, cityBySlug } from "@/lib/data";
import { breadcrumbJsonLd, clipMeta, localBusinessJsonLd, publicMeta } from "@/lib/seo";

export async function generateStaticParams() {
  return (await publicCatalog()).map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const b = await getPublicBusiness(slug);
  if (!b) return { title: "غير موجود" };
  const city = cityBySlug(b.city)?.name || b.city;
  const cat = categoryBySlug(b.category)?.name || "";
  return publicMeta({
    title: `${b.name} — ${cat} في ${city}`,
    description: clipMeta(
      b.about || `${b.name} في ${b.district}، ${city}. احجز أونلاين من موعدكم.`,
      160,
    ),
    path: `/salon/${b.slug}`,
    image: businessCover(b) || undefined,
  });
}

export default async function SalonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = await getPublicBusiness(slug);
  if (!b) notFound();
  const city = cityBySlug(b.city)?.name || b.city;
  const cat = categoryBySlug(b.category)?.name || "الحجز";
  return (
    <>
      <JsonLd data={localBusinessJsonLd(b)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: cat, path: `/c/${b.category}` },
          { name: city, path: `/c/${b.category}/${b.city}` },
          { name: b.name, path: `/salon/${b.slug}` },
        ])}
      />
      <SalonProfileView initial={b} />
    </>
  );
}
