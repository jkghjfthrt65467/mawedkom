import { JsonLd } from "@/components/seo/JsonLd";
import { BLOG } from "@/lib/data";
import { articleJsonLd, publicMeta } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return BLOG.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = BLOG.find((x) => x.slug === slug);
  if (!p) return { title: "غير موجود" };
  return publicMeta({
    title: p.title,
    description: p.excerpt,
    path: `/blog/${p.slug}`,
  });
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = BLOG.find((x) => x.slug === slug);
  if (!p) notFound();
  return (
    <article className="mx-auto max-w-2xl space-y-4">
      <JsonLd data={articleJsonLd(p)} />
      <Link href="/blog" className="text-sm text-palm">
        ← المدوّنة
      </Link>
      <p className="text-xs text-muted">{p.date}</p>
      <h1 className="text-3xl font-bold">{p.title}</h1>
      {p.body.map((para) => (
        <p key={para.slice(0, 24)} className="leading-8 text-muted">
          {para}
        </p>
      ))}
    </article>
  );
}
