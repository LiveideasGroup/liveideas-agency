import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site/content";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/login", "/mfa", "/auth", "/api", "/pilot/thanks"] },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
