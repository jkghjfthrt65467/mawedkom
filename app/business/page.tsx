import Link from "next/link";
import { PlansGrid } from "@/components/PlansGrid";
import { CategoryGrid } from "@/components/CategoryGrid";
import { FAQ } from "@/lib/data";

import { publicMeta } from "@/lib/seo";

export const metadata = publicMeta({
  title: "موعدكم للأعمال",
  description: "رتّب جدول مشروعك وأرسل تذكير واتساب من رقمك أو من نظام إشعارات المنصة. تجربة 30 يوم مرة واحدة.",
  path: "/business",
});

export default function BusinessPage() {
  return (
    <div className="space-y-10">
      <section className="nubo-card-ink p-8">
        <p className="text-gold">لأصحاب كل مشروع يشتغل بالموعد</p>
        <h1 className="mt-2 text-3xl font-bold leading-10 md:text-4xl">خلّ الزبون يحجز بروحه، وانت ركّز على الشغل</h1>
        <p className="mt-3 max-w-2xl text-ink/80 leading-8">
          موعدكم يرتّب الجدول، يمنع التعارض، ويرسل تذكير واتساب من رقمك أو من نظام إشعارات المنصة. ابدأ بتجربة 30 يوم مرة واحدة، ورقّي لما تكبر. الزبون ما يدفع عمولة.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/business/signup" className="nubo-btn nubo-btn-gold">
            سجّل مشروعك مجاناً
          </Link>
          <Link href="/business/manage" className="nubo-btn nubo-btn-ghost">
            لوحة المدير
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-2xl font-bold">الخطط</h2>
        <p className="mb-5 text-sm leading-7 text-muted">الأسعار بالدولار. الحجوزات تتحسب حسب شهر بغداد.</p>
        <PlansGrid />
      </section>

      <section>
        <h2 className="mb-5 text-2xl font-bold">كل المجالات</h2>
        <CategoryGrid showBlurb />
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">ثلاث خطوات</h2>
        <ol className="grid gap-3 md:grid-cols-3">
          {["سجّل مشروعك", "شارك رابط موعدكم", "استقبل المواعيد 7/24"].map((t, i) => (
            <li key={t} className="nubo-card p-5">
              <p className="text-gold">{i + 1}</p>
              <p className="font-bold">{t}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        {FAQ.slice(0, 3).map((f) => (
          <details key={f.q} className="nubo-card mb-2 px-4 py-3">
            <summary className="cursor-pointer font-semibold">{f.q}</summary>
            <p className="mt-2 text-sm text-muted">{f.a}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
