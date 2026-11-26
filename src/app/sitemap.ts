import type { MetadataRoute } from "next";
import { ARCADE_URL, GAMES } from "@/lib/games";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const liveGames = GAMES.filter((g) => g.status === "live" && g.href).map(
    (g) => ({
      url: `${ARCADE_URL}${g.href}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }),
  );

  return [
    {
      url: ARCADE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...liveGames,
  ];
}
