import { publicMeta } from "@/lib/seo";

export const metadata = publicMeta({
  title: "تواصل معنا",
  description: "راسل فريق موعدكم للاستفسار عن الحجز أو تسجيل مشروعك أو الدعم.",
  path: "/contact",
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
