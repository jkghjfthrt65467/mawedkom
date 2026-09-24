import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  transpilePackages: ["@iconscout/react-unicons"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async redirects() {
    return [
      { source: "/settings", destination: "/whatsapp", permanent: false },
      { source: "/c/spa", destination: "/salons", permanent: false },
      { source: "/c/spa/:city", destination: "/salons/:city", permanent: false },
      { source: "/salon/dijla-spa", destination: "/salons", permanent: false },
    ];
  },
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [
      { source: "/account", headers: noindex },
      { source: "/account/:path*", headers: noindex },
      { source: "/business/manage", headers: noindex },
      { source: "/business/manage/:path*", headers: noindex },
      { source: "/staff", headers: noindex },
      { source: "/staff/:path*", headers: noindex },
      { source: "/admin", headers: noindex },
      { source: "/admin/:path*", headers: noindex },
      { source: "/book/:path*", headers: noindex },
      { source: "/m/:path*", headers: noindex },
      { source: "/whatsapp", headers: noindex },
      { source: "/login", headers: noindex },
      { source: "/register", headers: noindex },
      { source: "/forgot", headers: noindex },
      { source: "/api/:path*", headers: noindex },
    ];
  },
};

export default nextConfig;
