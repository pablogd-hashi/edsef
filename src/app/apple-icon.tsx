import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#C4A77D",
          color: "#fffaf3",
          fontSize: 92,
          fontWeight: 600,
        }}
      >
        M
      </div>
    ),
    { ...size }
  );
}
