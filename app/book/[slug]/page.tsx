import { BookClient } from "@/components/BookClient";
import { getPublicBusiness } from "@/lib/business-server";
import { notFound } from "next/navigation";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string; manage?: string; staff?: string }>;
}) {
  const { slug } = await params;
  const { service, manage, staff } = await searchParams;
  const b = await getPublicBusiness(slug);
  if (!b) notFound();
  return <BookClient initial={b} presetService={service} presetStaff={staff} manageToken={manage} />;
}
