import { HomePageView } from "@/components/HomePageView";
import { publicCatalog } from "@/lib/business-server";
import { CATEGORIES } from "@/lib/data";

export default async function HomePage() {
  const featured = (await publicCatalog()).filter((b) => b.featured);
  return <HomePageView featured={featured} categoryCount={CATEGORIES.length} />;
}
