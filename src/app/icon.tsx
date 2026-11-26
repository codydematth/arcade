import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B0F19",
          borderRadius: 6,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: -0.5,
            color: "#6366F1",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          AF
        </div>
      </div>
    ),
    { ...size },
  );
}
