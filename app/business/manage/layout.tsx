import { ManagerGate } from "@/components/owner/ManagerGate";
import { noindexMeta } from "@/lib/seo";

export const metadata = noindexMeta("لوحة المدير");

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return <ManagerGate>{children}</ManagerGate>;
}
