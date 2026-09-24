import { LegalShell } from "@/components/legal/LegalShell";
import { RefundBody } from "@/components/legal/RefundBody";
import { REFUND_TOC } from "@/lib/legal";
import { publicMeta } from "@/lib/seo";

export const metadata = publicMeta({
  title: "سياسة الاسترجاع",
  description:
    "سياسة استرجاع موعدكم: حجز الزبون مجاني والدفع عند المحل، واشتراكات صاحب المشروع، ومشتريات Google Play وApp Store.",
  path: "/refund",
});

export default function RefundPage() {
  return (
    <LegalShell
      title="سياسة الاسترجاع والإلغاء"
      description="متى يُسترجع مبلغ دُفع لموعدكم، ومتى يبقى الطلب عند صاحب المشروع أو متجر التطبيقات. استخدم هذا الرابط في صفحة التطبيق إذا طلب المتجر سياسة استرجاع منفصلة."
      toc={REFUND_TOC}
    >
      <RefundBody />
    </LegalShell>
  );
}
