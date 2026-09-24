import { PlansGrid } from "@/components/PlansGrid";
import Link from "next/link";

import { publicMeta } from "@/lib/seo";

export const metadata = publicMeta({
  title: "الأسعار",
  description: "خطط موعدكم: تجربة 30 يوم مرة واحدة، ثم 5$ و10$ و20$ لواتسابك، أو 10$ بالشهر + تكلفة الحجز لإشعارات المنصة.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <p className="text-sm text-gold">موعدكم للأعمال</p>
        <h1 className="mt-2 text-3xl font-bold">خطط بالدولار، بلا عمولة على الحجز</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          الزبون يحجز مجاناً. التجربة المجانية مرة واحدة لمدة 30 يوم. تغيّر نوع خطتك من الضبط، والتفعيل حالياً عبر الدعم الفني.
        </p>
      </header>
      <PlansGrid />
      <p className="text-sm text-muted">
        عندك حساب؟ غيّر الخطة من{" "}
        <Link href="/business/manage/plan" className="font-semibold text-palm">
          لوحة المدير
        </Link>
        .
      </p>
    </div>
  );
}
