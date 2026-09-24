import { Listing } from "@/components/Listing";
import { publicCatalog } from "@/lib/business-server";
import { filterBusinesses } from "@/lib/data";
import { publicMeta } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = publicMeta({
  title: "كل المواعيد",
  description: "تصفح عيادات وصالونات وأطباء وكل مجالات الحجز في العراق. فلتر حسب المدينة والخدمة واحجز أونلاين.",
  path: "/salons",
});

export default async function SalonsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const list = filterBusinesses(await publicCatalog(), { q: sp.q, city: sp.city, category: sp.category });
  return (
    <Listing
      title="كل المواعيد"
      subtitle={`${list.length} مشروع على موعدكم`}
      list={list}
      city={sp.city}
      category={sp.category}
      q={sp.q}
    />
  );
}
