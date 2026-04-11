import { ImageResponse } from "next/og";

// Route segment config (Next.js 16 file-based metadata convention).
// The alt text is used as the <meta property="og:image:alt"> value.
export const alt = "ByteBoundless — Find Businesses That Need Better Websites";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Site-wide default OpenGraph image. Rendered as a simple branded
 * card with just text — no logo yet. When the logo is added, swap
 * the wordmark block for an <img> tag and redeploy.
 *
 * ImageResponse uses a minimal React subset — inline styles only,
 * no Tailwind, no external CSS. System sans fallback works fine
 * without a custom font fetch, which keeps cold starts fast.
 */
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "72px 96px",
          background:
            "linear-gradient(135deg, #FAFAFA 0%, #F0F4FF 50%, #E6EEFF 100%)",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          position: "relative",
        }}
      >
        {/* Accent corner glow */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -200,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0, 102, 255, 0.15) 0%, transparent 70%)",
          }}
        />

        {/* Top eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              background: "#0066FF",
              color: "#FFFFFF",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            B
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#1A1A1A",
              letterSpacing: "-0.02em",
            }}
          >
            ByteBoundless
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#1A1A1A",
            letterSpacing: "-0.035em",
            lineHeight: 1.05,
            marginBottom: 28,
            maxWidth: 960,
          }}
        >
          Find businesses that need better websites.
        </div>

        {/* Supporting copy */}
        <div
          style={{
            fontSize: 28,
            color: "#555",
            lineHeight: 1.4,
            maxWidth: 920,
            marginBottom: 40,
          }}
        >
          Lead intelligence for freelance web developers — scrape, score, pitch, and close.
        </div>

        {/* Feature chips */}
        <div
          style={{
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          {["Google Maps scraper", "Lighthouse audits", "AI pitch generator"].map((chip) => (
            <div
              key={chip}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 20px",
                borderRadius: 999,
                background: "rgba(0, 102, 255, 0.08)",
                color: "#0066FF",
                fontSize: 20,
                fontWeight: 600,
                border: "1px solid rgba(0, 102, 255, 0.2)",
              }}
            >
              {chip}
            </div>
          ))}
        </div>

        {/* URL at the bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 56,
            right: 96,
            fontSize: 20,
            color: "#888",
            fontFamily: "ui-monospace, Menlo, Monaco, monospace",
            fontWeight: 500,
          }}
        >
          byteboundless.io
        </div>
      </div>
    ),
    { ...size }
  );
}
