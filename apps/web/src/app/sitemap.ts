import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/** Advertise only routes that currently exist, without a database dependency. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: siteConfig.url, changeFrequency: "monthly", priority: 1 }];
}
