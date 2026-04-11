import type { MetadataRoute } from "next";

const SITE_URL = "https://byteboundless.io";

/**
 * Generates /robots.txt from this file at build time (Next.js 16
 * file-based metadata convention). The authenticated app routes
 * under (app) are disallowed in addition to the layout-level
 * robots: { index: false } header — belt and suspenders so crawlers
 * that ignore the header still skip those paths.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/search",
          "/lists",
          "/settings",
          "/admin",
          "/checkout",
          "/setup",
          "/feedback",
          "/guide",
          "/api/",
          "/auth/",
          "/unsubscribed",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
