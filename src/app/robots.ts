import type { MetadataRoute } from "next";
import { ARCADE_URL } from "@/lib/games";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${ARCADE_URL}/sitemap.xml`,
    host: ARCADE_URL,
  };
}
