import type { Metadata } from "next";
import { BRAND_AR, BRAND_EN, SITE_EMAIL, SITE_URL } from "@/lib/brand";
import type { Business, Staff } from "@/lib/types";

export function publicMeta({
  title,
  description,
  path,
  image,
  index = true,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  index?: boolean;
}): Metadata {
  const url = absUrl(path);
  const desc = clipMeta(description, 160);
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    robots: index ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: BRAND_AR,
      locale: "ar_IQ",
      type: "website",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export function noindexMeta(title: string, description?: string): Metadata {
  return {
    title,
    description,
    robots: { index: false, follow: false },
  };
}

export function absUrl(path = "/") {
  if (path.startsWith("http")) return path;
  return new URL(path, SITE_URL).toString();
}

export function clipMeta(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

export function schemaTypeForCategory(category: string): string {
  switch (category) {
    case "salon":
      return "BeautySalon";
    case "barber":
      return "HairSalon";
    case "beauty":
      return "BeautySalon";
    case "nails":
      return "NailSalon";
    case "laser":
    case "physio":
    case "psychology":
      return "MedicalBusiness";
    case "clinic":
      return "MedicalClinic";
    case "doctor":
      return "Physician";
    case "vet":
      return "VeterinaryCare";
    case "fitness":
      return "ExerciseGym";
    case "carwash":
      return "AutoRepair";
    default:
      return "LocalBusiness";
  }
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND_AR,
    alternateName: BRAND_EN,
    url: SITE_URL,
    inLanguage: "ar-IQ",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/salons?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND_AR,
    alternateName: BRAND_EN,
    url: SITE_URL,
    email: SITE_EMAIL,
    logo: absUrl("/icon"),
    areaServed: { "@type": "Country", name: "Iraq" },
  };
}

export function localBusinessJsonLd(b: Business) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaTypeForCategory(b.category),
    name: b.name,
    description: clipMeta(b.about, 220),
    url: absUrl(`/salon/${b.slug}`),
    telephone: b.phone || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: b.address || b.district,
      addressLocality: b.district,
      addressRegion: b.city,
      addressCountry: "IQ",
    },
    aggregateRating:
      b.rating && b.reviewCount
        ? {
            "@type": "AggregateRating",
            ratingValue: b.rating,
            reviewCount: b.reviewCount,
          }
        : undefined,
  };
  if (b.lat && b.lng) {
    data.geo = { "@type": "GeoCoordinates", latitude: b.lat, longitude: b.lng };
  }
  return data;
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absUrl(item.path),
    })),
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function articleJsonLd(post: { title: string; excerpt: string; slug: string; date: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    inLanguage: "ar-IQ",
    author: { "@type": "Organization", name: BRAND_AR },
    publisher: { "@type": "Organization", name: BRAND_AR, url: SITE_URL },
    mainEntityOfPage: absUrl(`/blog/${post.slug}`),
  };
}

export function itemListJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: absUrl(item.path),
    })),
  };
}

export function personJsonLd(staff: Staff, business: Pick<Business, "name" | "slug">) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: staff.name,
    jobTitle: staff.role,
    description: staff.bio || `${staff.name} · ${staff.role} في ${business.name}`,
    worksFor: {
      "@type": "LocalBusiness",
      name: business.name,
      url: absUrl(`/salon/${business.slug}`),
    },
    url: absUrl(`/salon/${business.slug}/staff/${staff.id}`),
  };
}
