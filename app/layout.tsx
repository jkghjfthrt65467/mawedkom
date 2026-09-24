import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppChrome } from "@/components/AppChrome";
import { LocaleProvider } from "@/components/LocaleProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { ThemeBoot } from "@/components/ThemeBoot";
import { ToastHost } from "@/components/ToastHost";
import { BRAND_AR, BRAND_EN, BRAND_TAGLINE, SITE_URL } from "@/lib/brand";
import { LOCALE_BOOT_SCRIPT } from "@/lib/i18n";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import "./globals.css";

const dubai = localFont({
  src: [
    { path: "./fonts/Dubai-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Dubai-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Dubai-Medium.woff2", weight: "600", style: "normal" },
    { path: "./fonts/Dubai-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-dubai",
  display: "swap",
});

const HOME_DESC = `${BRAND_AR} منصة عراقية لحجز مواعيد العيادات والأطباء وعلماء النفس والعلاج الطبيعي والصالونات وأخصائيي التجميل وتزيين الحيوانات وأكثر. ابحث ببغداد والبصرة وأربيل وباقي المحافظات، واحجز بدون تطبيق.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: BRAND_AR,
  title: {
    default: `${BRAND_AR} — حجز مواعيد بالعراق`,
    template: `%s | ${BRAND_AR}`,
  },
  description: HOME_DESC,
  keywords: [BRAND_AR, BRAND_EN, "حجز مواعيد", "عراق", "بغداد", "صالون", "عيادة", "حلاقة"],
  authors: [{ name: BRAND_AR, url: SITE_URL }],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "ar_IQ",
    url: SITE_URL,
    siteName: BRAND_AR,
    title: `${BRAND_AR} — حجز مواعيد بالعراق`,
    description: HOME_DESC,
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_AR} — ${BRAND_TAGLINE}`,
    description: HOME_DESC,
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar-IQ-u-nu-latn" dir="rtl" className={dubai.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LOCALE_BOOT_SCRIPT }} />
      </head>
      <body className={`${dubai.className} min-h-screen antialiased`}>
        <ThemeBoot />
        <LocaleProvider>
          <JsonLd data={organizationJsonLd()} />
          <JsonLd data={websiteJsonLd()} />
          <AppChrome>{children}</AppChrome>
          <ToastHost />
        </LocaleProvider>
      </body>
    </html>
  );
}
