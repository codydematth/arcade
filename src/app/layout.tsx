import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Syne } from "next/font/google";
import { LocaleBoot } from "@/components/locale-boot";
import {
  ARCADE_DESCRIPTION,
  ARCADE_NAME,
  ARCADE_TAGLINE,
  ARCADE_URL,
  CREATOR_NAME,
  CREATOR_URL,
} from "@/lib/games";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0B0F19",
};

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
  description: ARCADE_DESCRIPTION,
  applicationName: ARCADE_NAME,
  authors: [{ name: CREATOR_NAME, url: CREATOR_URL }],
  creator: CREATOR_NAME,
  keywords: [
    "Almost Fair",
    "Almost There",
    "web games",
    "browser arcade",
    "ragebait games",
    "Nigeria games",
    "Pidgin",
    "Matthias Amire",
  ],
  alternates: {
    canonical: ARCADE_URL,
  },
  openGraph: {
    title: `${ARCADE_NAME} — ${ARCADE_TAGLINE}`,
    description: ARCADE_DESCRIPTION,
    url: ARCADE_URL,
    siteName: ARCADE_NAME,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${ARCADE_NAME} — ${ARCADE_TAGLINE}`,
    description: ARCADE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: ARCADE_NAME,
    url: ARCADE_URL,
    description: ARCADE_DESCRIPTION,
    creator: {
      "@type": "Person",
      name: CREATOR_NAME,
      url: CREATOR_URL,
    },
  };

  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LocaleBoot />
        {children}
      </body>
    </html>
  );
}
