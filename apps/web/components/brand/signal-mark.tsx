// Signal-in-noise mark — secondary brand accent.
//
// A 5x5 grid of small white dots on the brand blue, with one dot
// brighter and circled to represent "the signal" — visually telling
// the product's core story (finding the one lead worth pursuing out
// of many). Used in loading states, empty states, social avatars,
// marketing illustrations, and as an accent in the OG image.
//
// Pure static SVG. No "use client". Works in any context.
//
// Usage:
//   <SignalMark className="w-12 h-12" />

interface SignalMarkProps {
  className?: string;
  ariaLabel?: string;
}

// Hoisted at module level — same constants every render, no need to
// recompute or pass through props. Cleaner than recomputing inside
// the function body on every call.
const COLS = 5;
const ROWS = 5;
const SPACING = 16;
const HIGHLIGHT_COL = 3;
const HIGHLIGHT_ROW = 2;
const START_X = (120 - (COLS - 1) * SPACING) / 2;
const START_Y = (120 - (ROWS - 1) * SPACING) / 2;

// Pre-compute the dot positions once at module load. Avoids the
// nested array map on every render.
const DOTS: Array<{ key: string; cx: number; cy: number; highlight: boolean }> = [];
for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < COLS; col++) {
    DOTS.push({
      key: `${row}-${col}`,
      cx: START_X + col * SPACING,
      cy: START_Y + row * SPACING,
      highlight: row === HIGHLIGHT_ROW && col === HIGHLIGHT_COL,
    });
  }
}

const HIGHLIGHT_X = START_X + HIGHLIGHT_COL * SPACING;
const HIGHLIGHT_Y = START_Y + HIGHLIGHT_ROW * SPACING;

export function SignalMark({
  className,
  ariaLabel = "ByteBoundless signal mark",
}: SignalMarkProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={ariaLabel}
    >
      <rect x="0" y="0" width="120" height="120" rx="26" fill="#0066FF" />
      {DOTS.map((dot) => (
        <circle
          key={dot.key}
          cx={dot.cx}
          cy={dot.cy}
          r={dot.highlight ? 4.5 : 2}
          fill="#FFFFFF"
          opacity={dot.highlight ? 1 : 0.35}
        />
      ))}
      <circle
        cx={HIGHLIGHT_X}
        cy={HIGHLIGHT_Y}
        r="10"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2"
        opacity="0.55"
      />
    </svg>
  );
}
