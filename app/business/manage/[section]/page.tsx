import { OwnerApp } from "@/components/owner/OwnerApp";

export default async function ManageSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <OwnerApp section={section} />;
}
