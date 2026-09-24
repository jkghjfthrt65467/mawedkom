import { publicMeta } from "@/lib/seo";

export const metadata = publicMeta({
  title: "من نحن",
  description: "موعدكم منصة ويب لحجز المواعيد في العراق: عربي RTL، مدن عراقية، دينار، وأرقام +964. الزبون يحجز من المتصفح.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <article className="prose-nubo mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold">موعدكم: مواعيد عراقية، بهوية عراقية</h1>
      <p className="leading-8 text-muted">
        موعدكم منصة ويب لحجز المواعيد في العراق: عيادات، أطباء، علماء نفس، علاج طبيعي، صالونات، أخصائيو تجميل، تزيين حيوانات وأكثر. الفكرة مألوفة عالمياً — رابط حجز + تقويم موظفين + تذكير — والتنفيذ هنا عربي RTL، مدن عراقية، دينار، وأرقام +964.
      </p>
      <p className="leading-8 text-muted">
        الموقع: mawedkom.com. نبني تجربة تناسب عادة الناس هنا: واتساب قوي، دفع عند المحل اليوم، ومحافظات من بغداد للبصرة لأربيل والنجف وكربلاء والموصل.
      </p>
      <h2 className="text-xl font-bold">ليش موعدكم؟</h2>
      <ul className="list-disc space-y-2 pr-5 text-muted leading-7">
        <li>الزبون يحجز من المتصفح بدون تطبيق.</li>
        <li>كل مجالات الموعد: عيادات وأطباء وعلماء نفس وعلاج طبيعي، صالونات وأخصائيو تجميل وتزيين حيوانات، إلى غسيل السيارات.</li>
        <li>الثقة: تقييمات، عنوان، سعر ظاهر، سياسة خصوصية واضحة.</li>
      </ul>
    </article>
  );
}
