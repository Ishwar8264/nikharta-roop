import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

/** Publishes crawler rules while keeping private and internal routes out. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/settings/", "/swagger-ui/"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
