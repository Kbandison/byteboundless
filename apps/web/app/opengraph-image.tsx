import { ImageResponse } from "next/og";

// Route segment config (Next.js 16 file-based metadata convention).
// The alt text is used as the <meta property="og:image:alt"> value.
export const alt = "ByteBoundless — Find Businesses That Need Better Websites";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Site-wide default OpenGraph image. Uses the locked brand:
 *   [b]   square mark in the eyebrow
 *   [byte]boundless wordmark in the eyebrow
 *   signal-in-noise grid as a corner accent
 *
 * ImageResponse uses a minimal React subset — inline styles only,
 * no Tailwind, no external CSS. System fonts only (no custom font
 * fetch) so cold starts stay fast. This means brackets and body
 * text use the closest system mono / sans match — Inter and Geist
 * Mono are loaded in-app via next/font but ImageResponse runs in
 * an isolated runtime that doesn't share that.
 */

// Brand palette (kept inline so this file is self-contained)
const ACCENT = "#0066FF";
const WHITE = "#FFFFFF";
const TEXT = "#111111";
const MONO_STACK =
  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
const SANS_STACK =
  "system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
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

        {/* Top eyebrow — [b] mark + [byte]boundless wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 40,
          }}
        >
          {/* [b] square mark */}
          <div
            style={{
              width: 56,
              height: 56,
              background: ACCENT,
              color: WHITE,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              fontFamily: MONO_STACK,
            }}
          >
            [b]
          </div>
          {/* [byte]boundless wordmark — mixed mono brackets + sans body */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: ACCENT,
                fontFamily: MONO_STACK,
              }}
            >
              [byte]
            </span>
            <span
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: TEXT,
                fontFamily: SANS_STACK,
                letterSpacing: "-0.02em",
                marginLeft: 4,
              }}
            >
              boundless
            </span>
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

        {/* Signal-in-noise mark — brand accent in the bottom-right
            corner. A 5x5 grid of dots with one highlighted, the
            same secondary mark used elsewhere. Tells the product
            story visually. */}
        <div
          style={{
            position: "absolute",
            bottom: 80,
            right: 96,
            width: 160,
            height: 160,
            background: ACCENT,
            borderRadius: 28,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            gap: 6,
          }}
        >
          {/* 25 dots in a 5x5 grid. The 13th (row=2,col=2) is the
              "signal" — bigger and full opacity. The rest are dim. */}
          {Array.from({ length: 25 }).map((_, i) => {
            const isSignal = i === 13;
            return (
              <div
                key={i}
                style={{
                  width: isSignal ? 14 : 8,
                  height: isSignal ? 14 : 8,
                  borderRadius: "50%",
                  background: WHITE,
                  opacity: isSignal ? 1 : 0.35,
                  margin: isSignal ? 0 : 3,
                }}
              />
            );
          })}
        </div>

        {/* URL at the bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 56,
            left: 96,
            fontSize: 20,
            color: "#888",
            fontFamily: MONO_STACK,
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
