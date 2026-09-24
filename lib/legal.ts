import { SITE_EMAIL, SITE_URL } from "@/lib/brand";

export const LEGAL_UPDATED_ISO = "2026-09-23";
export const LEGAL_UPDATED_AR = "23 أيلول 2026";
export const LEGAL_OPERATOR_AR = "مشغّل منصة موعدكم (Mawedkom)";
export const LEGAL_CONTACT_EMAIL = SITE_EMAIL;
export const LEGAL_CONTACT_PAGE = `${SITE_URL}/contact`;
export const LEGAL_PRIVACY_URL = `${SITE_URL}/privacy`;
export const LEGAL_TERMS_URL = `${SITE_URL}/terms`;
export const LEGAL_REFUND_URL = `${SITE_URL}/refund`;

export type LegalTocItem = { id: string; label: string };

export const TERMS_TOC: LegalTocItem[] = [
  { id: "accept", label: "قبول الشروط" },
  { id: "defs", label: "التعريفات" },
  { id: "who", label: "من يستخدم المنصة" },
  { id: "age", label: "العمر والأهلية" },
  { id: "accounts", label: "الحسابات والتطبيق" },
  { id: "bookings", label: "الحجز" },
  { id: "pay-venue", label: "الدفع عند المحل" },
  { id: "plans", label: "اشتراكات أصحاب المشاريع" },
  { id: "refund", label: "الاسترجاع والإلغاء" },
  { id: "whatsapp", label: "واتساب والإشعارات" },
  { id: "content", label: "المحتوى والمسؤولية" },
  { id: "forbidden", label: "الاستخدام الممنوع" },
  { id: "ip", label: "الملكية الفكرية" },
  { id: "privacy", label: "الخصوصية" },
  { id: "ads", label: "الإعلانات وقياس الأداء" },
  { id: "stores", label: "متاجر التطبيقات" },
  { id: "disclaimer", label: "إخلاء المسؤولية" },
  { id: "indemnity", label: "التعويض" },
  { id: "terminate", label: "إنهاء الحساب" },
  { id: "law", label: "القانون والاختصاص" },
  { id: "changes", label: "تعديل الشروط" },
  { id: "contact", label: "التواصل" },
];

export const PRIVACY_TOC: LegalTocItem[] = [
  { id: "who-we-are", label: "من نحن" },
  { id: "collect", label: "ما نجمعه" },
  { id: "how", label: "كيف نجمعه" },
  { id: "why", label: "ليش نستخدمه" },
  { id: "share", label: "مع من نشاركه" },
  { id: "cookies", label: "الكوكيز ومعرّفات الإعلان" },
  { id: "apps", label: "تطبيقات الموبايل" },
  { id: "kids", label: "الأطفال" },
  { id: "keep", label: "مدة الاحتفاظ" },
  { id: "security", label: "الأمان" },
  { id: "rights", label: "حقوقك" },
  { id: "delete", label: "حذف الحساب" },
  { id: "transfer", label: "نقل البيانات خارج العراق" },
  { id: "ads-privacy", label: "إعلانات Google والقياس" },
  { id: "changes-privacy", label: "تغيير السياسة" },
  { id: "contact-privacy", label: "التواصل" },
];

export const REFUND_TOC: LegalTocItem[] = [
  { id: "customer", label: "زبائن الحجز" },
  { id: "trial", label: "التجربة المجانية" },
  { id: "business", label: "اشتراكات أصحاب المشاريع" },
  { id: "usage", label: "رسوم الاستخدام والإشعارات" },
  { id: "stores-refund", label: "الشراء من Google Play أو App Store" },
  { id: "how-to", label: "كيف تطلب استرجاعاً" },
  { id: "exceptions", label: "ما لا يُسترجع" },
];
