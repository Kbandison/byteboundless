import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";

// Admin-only concept gallery — noindex via the (app) layout's robots
// header. This page exists to compare logo directions side by side
// before committing to one. Delete (or move) once a winner is picked.
export const metadata: Metadata = {
  title: "Logo Concepts",
  robots: { index: false, follow: false },
};

interface Concept {
  number: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  svg: React.ReactNode;
  /** Wider card for horizontal wordmarks (default is square). */
  wide?: boolean;
  /** Optional highlight (recommended, featured, etc). */
  highlight?: string;
}

// ─── Shared palette ──────────────────────────────────────────────
const ACCENT = "#0066FF";
const WHITE = "#FFFFFF";

// ─── Concept 1: Refined B mark ───────────────────────────────────
const Concept1Mark = () => (
  <svg
    viewBox="0 0 120 120"
    width="120"
    height="120"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Concept 1 — refined B mark"
  >
    <rect x="0" y="0" width="120" height="120" rx="26" fill={ACCENT} />
    <text
      x="60"
      y="60"
      fill={WHITE}
      fontFamily="Inter, system-ui, -apple-system, sans-serif"
      fontSize="80"
      fontWeight="800"
      textAnchor="middle"
      dominantBaseline="central"
      letterSpacing="-0.04em"
    >
      B
    </text>
  </svg>
);

// ─── Recommended Lockup (1+2) ────────────────────────────────────
const LockupMark = () => (
  <svg
    viewBox="0 0 360 120"
    width="360"
    height="120"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Recommended lockup — mark + wordmark"
  >
    <rect x="0" y="14" width="92" height="92" rx="20" fill={ACCENT} />
    <text
      x="46"
      y="60"
      fill={WHITE}
      fontFamily="Inter, system-ui, -apple-system, sans-serif"
      fontSize="60"
      fontWeight="800"
      textAnchor="middle"
      dominantBaseline="central"
      letterSpacing="-0.04em"
    >
      B
    </text>
    <text
      x="110"
      y="60"
      fill="#111111"
      fontFamily="Inter, system-ui, -apple-system, sans-serif"
      fontSize="36"
      fontWeight="800"
      dominantBaseline="central"
      letterSpacing="-0.03em"
    >
      ByteBoundless
    </text>
  </svg>
);

// ─── Concept 2: Bracket wordmark ─────────────────────────────────
const Concept2Mark = () => (
  <svg
    viewBox="0 0 360 120"
    width="360"
    height="120"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Concept 2 — bracket wordmark"
  >
    <text
      x="180"
      y="60"
      fill={ACCENT}
      fontFamily="Geist Mono, ui-monospace, Menlo, monospace"
      fontSize="38"
      fontWeight="700"
      textAnchor="end"
      dominantBaseline="central"
    >
      [byte]
    </text>
    <text
      x="184"
      y="60"
      fill="#111111"
      fontFamily="Inter, system-ui, -apple-system, sans-serif"
      fontSize="38"
      fontWeight="800"
      textAnchor="start"
      dominantBaseline="central"
      letterSpacing="-0.03em"
    >
      boundless
    </text>
  </svg>
);

// ─── Concept 3: B escaping boundary ──────────────────────────────
const Concept3Mark = () => (
  <svg
    viewBox="0 0 160 120"
    width="160"
    height="120"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Concept 3 — B escaping boundary"
  >
    {/* Blue square with the right edge clipped off */}
    <path
      d="M 26 6 L 112 6 Q 138 6 138 32 L 138 88 Q 138 114 112 114 L 26 114 Q 0 114 0 88 L 0 32 Q 0 6 26 6 Z"
      fill={ACCENT}
    />
    {/* B character, positioned so the right side extends beyond the clipped square */}
    <text
      x="58"
      y="60"
      fill={WHITE}
      fontFamily="Inter, system-ui, -apple-system, sans-serif"
      fontSize="76"
      fontWeight="800"
      textAnchor="middle"
      dominantBaseline="central"
      letterSpacing="-0.04em"
    >
      B
    </text>
    {/* Breakout arrow extending past the boundary */}
    <path
      d="M 118 60 L 154 60"
      stroke={ACCENT}
      strokeWidth="8"
      strokeLinecap="round"
    />
    <path
      d="M 144 50 L 158 60 L 144 70"
      stroke={ACCENT}
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

// ─── Concept 4: Radar pulse ──────────────────────────────────────
const Concept4Mark = () => (
  <svg
    viewBox="0 0 120 120"
    width="120"
    height="120"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Concept 4 — radar pulse"
  >
    <rect x="0" y="0" width="120" height="120" rx="26" fill={ACCENT} />
    {/* Concentric rings */}
    <circle
      cx="60"
      cy="60"
      r="40"
      fill="none"
      stroke={WHITE}
      strokeWidth="3"
      opacity="0.25"
    />
    <circle
      cx="60"
      cy="60"
      r="28"
      fill="none"
      stroke={WHITE}
      strokeWidth="3"
      opacity="0.5"
    />
    <circle
      cx="60"
      cy="60"
      r="16"
      fill="none"
      stroke={WHITE}
      strokeWidth="3"
    />
    <circle cx="60" cy="60" r="6" fill={WHITE} />
    {/* Sweep / signal line pointing north-east */}
    <line
      x1="60"
      y1="60"
      x2="92"
      y2="28"
      stroke={WHITE}
      strokeWidth="4"
      strokeLinecap="round"
    />
    <circle cx="92" cy="28" r="5" fill={WHITE} />
  </svg>
);

// ─── Concept 5: Pixel-stack B ────────────────────────────────────
const Concept5Mark = () => {
  // B shape on a 4-col × 7-row grid.
  // X = filled pixel, . = empty
  const pattern = [
    [1, 1, 1, 0],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 0],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 0],
  ];
  const pixelSize = 10;
  const gap = 2;
  const stride = pixelSize + gap;
  const width = 4 * stride - gap; // 46
  const height = 7 * stride - gap; // 82
  const offsetX = (120 - width) / 2; // 37
  const offsetY = (120 - height) / 2; // 19
  return (
    <svg
      viewBox="0 0 120 120"
      width="120"
      height="120"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Concept 5 — pixel-stack B"
    >
      <rect x="0" y="0" width="120" height="120" rx="26" fill={ACCENT} />
      <g fill={WHITE}>
        {pattern.map((row, rowIdx) =>
          row.map((cell, colIdx) =>
            cell ? (
              <rect
                key={`${rowIdx}-${colIdx}`}
                x={offsetX + colIdx * stride}
                y={offsetY + rowIdx * stride}
                width={pixelSize}
                height={pixelSize}
                rx="1"
              />
            ) : null
          )
        )}
      </g>
    </svg>
  );
};

// ─── Concept 6: B chevron ────────────────────────────────────────
const Concept6Mark = () => (
  <svg
    viewBox="0 0 120 120"
    width="120"
    height="120"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Concept 6 — B chevron"
  >
    <rect x="0" y="0" width="120" height="120" rx="26" fill={ACCENT} />
    <text
      x="42"
      y="60"
      fill={WHITE}
      fontFamily="Inter, system-ui, -apple-system, sans-serif"
      fontSize="70"
      fontWeight="800"
      textAnchor="middle"
      dominantBaseline="central"
      letterSpacing="-0.04em"
    >
      B
    </text>
    {/* Chevron breaking out of the stem */}
    <path
      d="M 70 40 L 94 60 L 70 80"
      stroke={WHITE}
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const concepts: Concept[] = [
  {
    number: "01",
    title: "Refined B mark",
    description:
      "Rounded square with a custom B in Inter Bold. Evolves the current placeholder into the real thing.",
    pros: [
      "Lowest risk — keeps everything shipped looking intentional",
      "Reads at 16px favicon size",
      "Instantly recognizable standalone mark",
    ],
    cons: ["Most common direction, no strong personality"],
    svg: <Concept1Mark />,
  },
  {
    number: "★",
    title: "Mark + wordmark lockup",
    description:
      "Concept 1's mark paired with a clean Inter Bold wordmark. One lockup that works everywhere — sidebar, OG card, favicon (use just the mark), email header.",
    pros: [
      "Covers every brand surface with a single asset",
      "Wordmark is instantly legible",
      "Mark doubles as favicon without extra work",
    ],
    cons: ["Still depends on the underlying B mark being strong"],
    svg: <LockupMark />,
    wide: true,
    highlight: "RECOMMENDED",
  },
  {
    number: "02",
    title: "Bracket wordmark",
    description:
      "[byte] in monospace brackets, boundless in sans. No icon — just a wordmark that leans into the tech-native identity.",
    pros: [
      "Distinctive and memorable",
      "No Chris-and-Jane-could-draw-this problem",
      "Tech-native audience reads the [brackets] reference instantly",
    ],
    cons: [
      "No symbolic mark — still need a separate favicon",
      "Brackets can look gimmicky if the monospace font is weak",
    ],
    svg: <Concept2Mark />,
    wide: true,
  },
  {
    number: "03",
    title: "Boundary break",
    description:
      "A B inside a boundary, with an arrow breaking past the edge. Literalizes boundless.",
    pros: [
      "Direct visual metaphor for the brand name",
      "More personality than a straight B mark",
    ],
    cons: [
      "Arrow extension complicates favicon cropping",
      "Can read as 'export' or 'next' iconography",
    ],
    svg: <Concept3Mark />,
    wide: true,
  },
  {
    number: "04",
    title: "Radar pulse",
    description:
      "Concentric rings with a signal line — evokes finding signal in noise, which is the core pitch of the product.",
    pros: [
      "Directly tied to the 'find leads' value prop",
      "Distinct from generic SaaS marks",
    ],
    cons: [
      "Reads as security/monitoring tools (Sentry, Datadog)",
      "Abstract — no letter reference, harder to pair with wordmark",
    ],
    svg: <Concept4Mark />,
  },
  {
    number: "05",
    title: "Pixel-stack B",
    description:
      "A B constructed from discrete squares. Literalizes the 'byte' in the name and builds the letter from its atomic unit.",
    pros: [
      "Clever, distinctive, instantly readable",
      "Scales down to favicon with each pixel staying crisp",
    ],
    cons: [
      "Can read as retro / 8-bit / pixel-art which isn't quite the brand tone",
      "More complex to render in small contexts",
    ],
    svg: <Concept5Mark />,
  },
  {
    number: "06",
    title: "B chevron",
    description:
      "A B followed by a chevron suggesting forward motion and beyond. Similar energy to Linear, Raycast, Vercel.",
    pros: [
      "More personality than the straight B mark",
      "Chevron implies action and momentum",
      "Modern tech-brand feel",
    ],
    cons: [
      "Dense at favicon size — chevron can get lost",
      "Chevron reading depends on typographic balance",
    ],
    svg: <Concept6Mark />,
  },
];

function ConceptCard({ concept }: { concept: Concept }) {
  return (
    <div
      className={
        "rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] p-8 flex flex-col " +
        (concept.wide ? "lg:col-span-2" : "")
      }
    >
      {/* Header row — number + highlight */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-[10px] uppercase tracking-[0.15em] font-[family-name:var(--font-mono)] text-[var(--color-text-dim)]">
          Concept {concept.number}
        </p>
        {concept.highlight && (
          <span className="text-[10px] uppercase tracking-[0.15em] font-semibold px-2 py-1 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
            {concept.highlight}
          </span>
        )}
      </div>

      {/* Mark stage — neutral background to show the logo */}
      <div className="flex items-center justify-center py-8 px-4 rounded-xl bg-white border border-[var(--color-border)]/50 mb-6 min-h-[200px]">
        {concept.svg}
      </div>

      {/* Meta */}
      <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight mb-2">
        {concept.title}
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
        {concept.description}
      </p>

      {/* Pros / cons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto pt-4 border-t border-[var(--color-border)]/50">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 mb-2">
            Pros
          </p>
          <ul className="space-y-1.5">
            {concept.pros.map((p) => (
              <li
                key={p}
                className="text-xs text-[var(--color-text-secondary)] leading-relaxed flex gap-2"
              >
                <span className="text-emerald-600 shrink-0">+</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-red-600 mb-2">
            Cons
          </p>
          <ul className="space-y-1.5">
            {concept.cons.map((c) => (
              <li
                key={c}
                className="text-xs text-[var(--color-text-secondary)] leading-relaxed flex gap-2"
              >
                <span className="text-red-600 shrink-0">−</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default async function LogoConceptsPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-7xl px-6 md:px-8 py-10">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-accent)] font-medium font-[family-name:var(--font-mono)] mb-2">
          Brand Review
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight mb-3">
          Logo Concepts
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-2xl">
          Six directions for the ByteBoundless mark plus the recommended
          lockup. Concept 1 and the lockup are also rendered in the
          Figma file. The rest are only here for side-by-side comparison.
          Delete this page once a winner is picked.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {concepts.map((c) => (
          <ConceptCard key={c.title} concept={c} />
        ))}
      </div>
    </div>
  );
}
