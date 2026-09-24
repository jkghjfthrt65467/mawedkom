import { publicMeta } from "@/lib/seo";

export const metadata = publicMeta({
  title: "سجّل مشروعك",
  description: "افتح صفحة حجز لمشروعك على موعدكم. تجربة مجانية مرة واحدة لمدة 30 يوم، بدون عمولة على الزبون.",
  path: "/business/signup",
});

export default function BusinessSignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
