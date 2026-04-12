// ByteBoundless wordmark — [byte]boundless
//
// Pure static SVG component. No "use client" — works in both server
// and client contexts. The brackets and "byte" use Geist Mono, the
// "boundless" body uses Inter Bold. Both fonts are loaded by next/font
// in the root layout, so any inline SVG inside the page tree picks
// them up automatically.
//
// Usage:
//   <Wordmark />                    // default — dark text on light bg
//   <Wordmark variant="inverse" />  // white text for blue/dark bg
//   <Wordmark className="h-6" />    // sized via Tailwind on the SVG
//
// The viewBox is locked at 360x80 so callers can size with width or
// height classes and the wordmark scales proportionally.

interface WordmarkProps {
  className?: string;
  variant?: "default" | "inverse";
  /** Optional accessible label override */
  ariaLabel?: string;
}

export function Wordmark({
  className,
  variant = "default",
  ariaLabel = "ByteBoundless",
}: WordmarkProps) {
  const bracketColor = variant === "inverse" ? "#FFFFFF" : "#0066FF";
  const bodyColor = variant === "inverse" ? "#FFFFFF" : "#111111";

  return (
    <svg
      viewBox="0 0 360 80"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={ariaLabel}
    >
      <text
        x="178"
        y="40"
        fill={bracketColor}
        fontFamily="Geist Mono, ui-monospace, Menlo, monospace"
        fontSize="38"
        fontWeight="700"
        textAnchor="end"
        dominantBaseline="central"
      >
        [byte]
      </text>
      <text
        x="182"
        y="40"
        fill={bodyColor}
        fontFamily="Inter, system-ui, -apple-system, sans-serif"
        fontSize="38"
        fontWeight="800"
        textAnchor="start"
        dominantBaseline="central"
        letterSpacing="-1"
      >
        boundless
      </text>
    </svg>
  );
}
