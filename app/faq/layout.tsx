import { JsonLd } from "@/components/seo/JsonLd";
import { FAQ } from "@/lib/data";
import { faqJsonLd, publicMeta } from "@/lib/seo";

export const metadata = publicMeta({
  title: "الأسئلة الشائعة",
  description: "إجابات عن حجز موعدكم: المجانية، التطبيق، الدفع عند المحل، الإلغاء، وواتساب.",
  path: "/faq",
});

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={faqJsonLd(FAQ)} />
      {children}
    </>
  );
}
