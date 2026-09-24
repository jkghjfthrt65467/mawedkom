import { publicMeta } from "@/lib/seo";

export const metadata = publicMeta({
  title: "الخصوصية",
  description: "كيف تجمع موعدكم الاسم ورقم +964 وبيانات الموعد، وليش، وما نبيع الأرقام للإعلان.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 text-sm leading-8 text-muted">
      <h1 className="text-3xl font-bold text-ink">سياسة الخصوصية</h1>
      <p>آخر تحديث: 11 أيلول 2026.</p>
      <h2 className="text-lg font-bold text-ink">شنو نجمع؟</h2>
      <p>الاسم، رقم +964، إيميل اختياري، بيانات الموعد (محل، خدمة، موظف، وقت)، ومفضلاتك إذا سجّلت. بيانات المشروع والحجز تتخزن على سيرفر موعدكم بقاعدة بيانات PostgreSQL، وما نبيعها للإعلان.</p>
      <h2 className="text-lg font-bold text-ink">ليش؟</h2>
      <p>لتأكيد الموعد، تذكير واتساب لاحقاً، وإدارة حسابك. ما نبيع الأرقام للإعلان.</p>
      <h2 className="text-lg font-bold text-ink">المشاركة لاحقاً</h2>
      <p>واتساب للتذكير، مزوّد SMS عراقي عند الحاجة، وبوابات دفع محلية إذا فعّلناها. الخرائط والتحليلات تُذكر هنا قبل التشغيل.</p>
      <h2 className="text-lg font-bold text-ink">حقوقك</h2>
      <p>تعديل الملف، حذف الحساب، وطلب نسخة من بياناتك بعد ما يصير عندنا سيرفر. تواصل من صفحة الاتصال.</p>
    </article>
  );
}
