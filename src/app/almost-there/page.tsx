import type { Metadata } from "next";
import { AlmostThereGame } from "@/components/almost-there-game";
import { ARCADE_URL } from "@/lib/games";

const title = "Almost There";
const description =
  "One-button jump game that looks fair until the last platform. Unlock Honest Mode in 3 wins. Film the near-miss. Share the roast.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: `${ARCADE_URL}/almost-there`,
  },
  openGraph: {
    title: `${title} · Almost Fair`,
    description,
    url: `${ARCADE_URL}/almost-there`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} · Almost Fair`,
    description,
  },
};

export default function AlmostTherePage() {
  return <AlmostThereGame />;
}
