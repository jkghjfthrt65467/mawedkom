import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { StaffProfileView } from "@/components/StaffProfileView";
import { getPublicBusiness, publicCatalog } from "@/lib/business-server";
import { clipMeta, personJsonLd, publicMeta } from "@/lib/seo";

export async function generateStaticParams() {
  const catalog = await publicCatalog();
  return catalog.flatMap((b) =>
    (b.staff || []).map((s) => ({ slug: b.slug, staffId: s.id })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; staffId: string }>;
}): Promise<Metadata> {
  const { slug, staffId } = await params;
  const b = await getPublicBusiness(slug);
  const staff = b?.staff.find((s) => s.id === staffId);
  if (!b || !staff) return { title: "غير موجود" };
  return publicMeta({
    title: `${staff.name} — ${b.name}`,
    description: clipMeta(staff.bio || `${staff.name} · ${staff.role} في ${b.name}. احجز موعده من موعدكم.`, 160),
    path: `/salon/${b.slug}/staff/${staff.id}`,
    image: staff.photo,
  });
}

export default async function StaffProfilePage({
  params,
}: {
  params: Promise<{ slug: string; staffId: string }>;
}) {
  const { slug, staffId } = await params;
  const b = await getPublicBusiness(slug);
  const staff = b?.staff.find((s) => s.id === staffId);
  if (!b || !staff) notFound();
  return (
    <>
      <JsonLd data={personJsonLd(staff, b)} />
      <StaffProfileView initial={b} staffId={staffId} />
    </>
  );
}
