import { publicMeta } from "@/lib/seo";

export const metadata = publicMeta({
  title: "شروط الاستخدام",
  description: "شروط استخدام موعدكم: الحجز والدفع عند المحل، مسؤولية صاحب المشروع، والاستخدام الممنوع.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 text-sm leading-8 text-muted">
      <h1 className="text-3xl font-bold text-ink">شروط الاستخدام</h1>
      <p>باستخدام موعدكم توافق على هذي الشروط. موعدكم وسيط تقني بين الزبون وصاحب المحل؛ جودة الخدمة الفعلية على المحل.</p>
      <h2 className="text-lg font-bold text-ink">الحجز والدفع</h2>
      <p>السعر المعروض بالدينار للعلم. الدفع حالياً عند الحضور. الإلغاء وإعادة الجدولة حسب سياسة كل محل.</p>
      <h2 className="text-lg font-bold text-ink">صاحب المحل</h2>
      <p>مسؤول عن دقة الخدمات والساعات والموظفين، وعن موافقة الزبون على الرسائل. صاحب المشروع يبدأ بخطة مجانية ويقدر يرقّي حسب عدد الموظفين والحجوزات. الحجز للزبون يبقى مجاناً بلا عمولة.</p>
      <h2 className="text-lg font-bold text-ink">الاستخدام الممنوع</h2>
      <p>حسابات وهمية، إساءة للنظام، أو استخدام المنصة لنشاط مخالف للقانون العراقي.</p>
      <h2 className="text-lg font-bold text-ink">العمر</h2>
      <p>18 سنة أو بإشراف ولي أمر.</p>
      <h2 className="text-lg font-bold text-ink">الأيقونات</h2>
      <p>
        أيقونات الواجهة من{" "}
        <a href="https://iconscout.com/unicons" className="font-semibold text-palm" target="_blank" rel="noreferrer">
          Unicons by IconScout
        </a>
        .
      </p>
    </article>
  );
}
