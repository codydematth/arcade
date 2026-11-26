import { ImageResponse } from "next/og";
import { ARCADE_NAME, ARCADE_TAGLINE } from "@/lib/games";

export const runtime = "edge";
export const alt = `${ARCADE_NAME} — ${ARCADE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "#0B0F19",
          color: "#F8FAFC",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 12,
            background: "#6366F1",
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#818CF8",
          }}
        >
          Web arcade
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "flex",
              fontSize: 96,
              fontWeight: 800,
              lineHeight: 0.95,
              letterSpacing: -2,
            }}
          >
            Almost{" "}
            <span style={{ color: "#6366F1", marginLeft: 18 }}>Fair</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 32,
              color: "#94A3B8",
              maxWidth: 780,
            }}
          >
            {ARCADE_TAGLINE} Near-misses, fake floors, roast cards.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 24,
            color: "#10B981",
            fontWeight: 600,
          }}
        >
          <span>games.matthiasamire.com</span>
          <span style={{ color: "#818CF8" }}>Play Almost There</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
