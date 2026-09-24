import { noindexMeta } from "@/lib/seo";

export const metadata = noindexMeta("الإدارة");

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
