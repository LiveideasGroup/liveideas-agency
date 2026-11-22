import type { MetadataRoute } from "next";
import { SERVICES, SITE } from "@/lib/site/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/proof", "/pilot", "/contact", "/how-we-work", "/legal/privacy", "/legal/terms", "/legal/ai", ...SERVICES.map((s) => `/services/${s.slug}`)];
  return paths.map((p) => ({ url: `${SITE.url}${p}`, changeFrequency: "weekly", priority: p === "/" ? 1 : 0.7 }));
}
