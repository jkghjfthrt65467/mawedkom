# موعدكم

منصة ويب عراقية لحجز المواعيد: [mawedkom.com](https://mawedkom.com)

البحث والتوثيق في `docs/research-randevunasil.md`.

## التشغيل

```bash
npm install
npm run dev
```

افتح الموقع على المنفذ اللي يظهره `dev` (غالباً [http://127.0.0.1:3000](http://127.0.0.1:3000)). الدومين العام: `https://mawedkom.com`.

## واتساب (من رقمك للزبائن)

بوابة محلية تربط واتساب عبر QR (الأجهزة المربوطة). شغّلها بطرفية ثانية قبل الموقع:

```bash
npm run wa
npm run dev
```

بعدين افتح `/whatsapp` وامسح الكود من واتساب ← الأجهزة المربوطة ← ربط جهاز. الجلسة تنحفظ في `.wa-session/` (ما تترفع للمستودع). بعد الربط، تأكيد وإلغاء الحجز ينرسلون لرقم الزبون من نفس واتساب.

## المكدس

Next.js (App Router) + TypeScript + Tailwind v4. البيانات والمصادقة والحجوزات محلية (ملفات + `localStorage`).

## المسارات الأساسية

`/` `/salons` `/salon/[slug]` `/book/[slug]` `/login` `/account` `/whatsapp` `/business` `/business/manage` `/business/manage/calendar` `/staff` `/faq` `/privacy` `/terms`

لوحة المدير: `/business/manage` — الرمز التجريبي `1234`. التقويم الأسبوعي/اليومي: `/business/manage/calendar`. بوابة الموظف (مواعيده فقط): `/staff` بنفس الرمز مع اختيار الاسم.
