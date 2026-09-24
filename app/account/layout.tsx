import { AccountChrome } from "@/components/AccountChrome";
import { noindexMeta } from "@/lib/seo";

export const metadata = noindexMeta("حسابي");

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountChrome>{children}</AccountChrome>;
}
