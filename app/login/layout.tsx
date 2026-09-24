import { noindexMeta } from "@/lib/seo";

export const metadata = noindexMeta("تسجيل الدخول");

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
