import type { Metadata } from "next";
import { IBM_Plex_Sans, Syne } from "next/font/google";
import { LocaleBoot } from "@/components/locale-boot";
import { ARCADE_NAME, ARCADE_TAGLINE, ARCADE_URL } from "@/lib/games";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const body = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(ARCADE_URL),
  title: {
    default: `${ARCADE_NAME} — ${ARCADE_TAGLINE}`,
    template: `%s · ${ARCADE_NAME}`,
  },
  description:
    "Lightweight ragebait web games made for short clips. Play Almost There, film the near-miss, send people to games.matthiasamire.com.",
  applicationName: ARCADE_NAME,
  openGraph: {
    title: `${ARCADE_NAME} — ${ARCADE_TAGLINE}`,
    description:
      "Funny, unfair-feeling micro games. Built to watch, rage-play, and share.",
    url: ARCADE_URL,
    siteName: ARCADE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${ARCADE_NAME}`,
    description: ARCADE_TAGLINE,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <LocaleBoot />
        {children}
      </body>
    </html>
  );
}
