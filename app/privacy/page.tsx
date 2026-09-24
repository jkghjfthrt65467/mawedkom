import { LegalShell } from "@/components/legal/LegalShell";
import { PrivacyBody } from "@/components/legal/PrivacyBody";
import { PRIVACY_TOC } from "@/lib/legal";
import { publicMeta } from "@/lib/seo";

export const metadata = publicMeta({
  title: "سياسة الخصوصية",
  description:
    "سياسة خصوصية موعدكم: ما نجمعه من الاسم والرقم والحجز، كيف نستخدمه، حقوق الحذف، والتطبيقات والإعلانات. رابط مستقل لمتاجر التطبيقات وGoogle Ads.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalShell
      title="سياسة الخصوصية"
      description="هذه الصفحة هي سياسة الخصوصية المستقلة المطلوبة من Google Play وApp Store وGoogle Ads. نشرح ما نجمع، ليش، مع من يتشارك، وكيف تحذف حسابك."
      toc={PRIVACY_TOC}
    >
      <PrivacyBody />
    </LegalShell>
  );
}
