// ByteBoundless square mark — [b] inside a blue rounded square.
//
// The companion mark to the wordmark. Designed to work as a favicon,
// app icon, social avatar, sidebar icon, and any other square context
// where the full wordmark won't fit. Uses the same monospace bracket
// motif as the wordmark so the system reads as one brand.
//
// Pure static SVG. No "use client". Works in any context.
//
// Usage:
//   <Mark className="w-8 h-8" />  // sized via Tailwind on the SVG

interface MarkProps {
  className?: string;
  ariaLabel?: string;
}

export function Mark({
  className,
  ariaLabel = "ByteBoundless",
}: MarkProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={ariaLabel}
    >
      <rect x="0" y="0" width="120" height="120" rx="26" fill="#0066FF" />
      <text
        x="60"
        y="62"
        fill="#FFFFFF"
        fontFamily="Geist Mono, ui-monospace, Menlo, monospace"
        fontSize="56"
        fontWeight="700"
        textAnchor="middle"
        dominantBaseline="central"
      >
        [b]
      </text>
    </svg>
  );
}
