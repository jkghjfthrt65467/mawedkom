import { LegalShell } from "@/components/legal/LegalShell";
import { TermsBody } from "@/components/legal/TermsBody";
import { TERMS_TOC } from "@/lib/legal";
import { publicMeta } from "@/lib/seo";

export const metadata = publicMeta({
  title: "شروط الاستخدام",
  description:
    "شروط استخدام موعدكم الكاملة: الحجز، الاشتراكات، الاسترجاع، الخصوصية، التطبيقات، وإعلانات Google. صالحة لروابط Google Play وApp Store.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalShell
      title="شروط الاستخدام"
      description="اتفاق استخدام موقع وتطبيقات موعدكم في العراق. يشمل الخصوصية والاسترجاع ومتطلبات نشر التطبيق على Google Play وApp Store وتشغيل إعلانات Google."
      toc={TERMS_TOC}
    >
      <TermsBody />
    </LegalShell>
  );
}
