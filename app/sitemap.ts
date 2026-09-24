import type { MetadataRoute } from "next";
import { publicCatalog } from "@/lib/business-server";
import { BLOG, CATEGORIES, CITIES } from "@/lib/data";
import { SITE_URL } from "@/lib/brand";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const catalog = await publicCatalog();
  const staticPaths = [
    "/",
    "/salons",
    "/business",
    "/business/signup",
    "/pricing",
    "/faq",
    "/about",
    "/contact",
    "/blog",
    "/privacy",
    "/terms",
  ];

  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));

  for (const city of CITIES) {
    entries.push({
      url: `${SITE_URL}/salons/${city.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const cat of CATEGORIES) {
    entries.push({
      url: `${SITE_URL}/c/${cat.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
    for (const city of CITIES) {
      entries.push({
        url: `${SITE_URL}/c/${cat.slug}/${city.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  for (const b of catalog) {
    entries.push({
      url: `${SITE_URL}/salon/${b.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    });
    for (const staff of b.staff || []) {
      entries.push({
        url: `${SITE_URL}/salon/${b.slug}/staff/${staff.id}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  }

  for (const post of BLOG) {
    entries.push({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  return entries;
}
