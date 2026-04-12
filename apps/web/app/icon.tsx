import { ImageResponse } from "next/og";

// Next.js 16 file convention: app/icon.tsx exports a default
// component that renders to a PNG via ImageResponse, and the
// framework auto-generates the <link rel="icon"> tag at the right
// size. Replaces the placeholder favicon.ico with the actual brand
// mark — [b] in mono on a blue rounded square.

export const size = { width: 96, height: 96 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0066FF",
          borderRadius: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          color: "#FFFFFF",
          fontSize: 48,
          fontWeight: 700,
          letterSpacing: "-0.04em",
        }}
      >
        [b]
      </div>
    ),
    { ...size }
  );
}
