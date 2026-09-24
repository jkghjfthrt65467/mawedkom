import Link from "next/link";
import { BLOG } from "@/lib/data";

import { publicMeta } from "@/lib/seo";

export const metadata = publicMeta({
  title: "المدوّنة",
  description: "نصوص بالعراقي عن مواعيد المحلات والعيادات وكل مجالات الحجز — مو نسخ من مواقع ثانية.",
  path: "/blog",
});

export default function BlogPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">مدوّنة موعدكم</h1>
      <p className="text-muted">نصوص بالعراقي عن مواعيد المحلات والعيادات وكل مجالات الحجز — مو نسخ من مواقع ثانية.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {BLOG.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className="nubo-card nubo-select-card p-5">
            <p className="text-xs text-muted">{p.date}</p>
            <h2 className="mt-2 text-xl font-bold">{p.title}</h2>
            <p className="mt-2 text-sm leading-7 text-muted">{p.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
