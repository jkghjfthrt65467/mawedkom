import { noindexMeta } from "@/lib/seo";

export const metadata = noindexMeta("إتمام الحجز");

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
