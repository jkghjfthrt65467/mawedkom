import { noindexMeta } from "@/lib/seo";

export const metadata = noindexMeta("لوحة الموظف");

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return children;
}
