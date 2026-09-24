import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/account",
          "/account/",
          "/business/manage",
          "/business/manage/",
          "/staff",
          "/staff/",
          "/admin",
          "/admin/",
          "/book/",
          "/m/",
          "/whatsapp",
          "/login",
          "/register",
          "/forgot",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
