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

interface Section {
  eyebrow: string;
  title: string;
  description: string;
  concepts: Concept[];
}

// ─── Shared palette ──────────────────────────────────────────────
const ACCENT = "#0066FF";
const WHITE = "#FFFFFF";
const BLACK = "#111111";

// ══════════════════════════════════════════════════════════════════
// SECTION 1 — Concept 2 refinements (bracket wordmark)
// ══════════════════════════════════════════════════════════════════

// Original [byte]boundless — kept for side-by-side comparison
const Concept2Original = () => (
  <svg
    viewBox="0 0 360 120"
    width="360"
    height="120"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Original [byte]boundless wordmark"
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
      fill={BLACK}
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

// Refinement 2a — angle brackets <byte>boundless
const Concept2Angle = () => (
  <svg
    viewBox="0 0 360 120"
    width="360"
    height="120"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Angle bracket wordmark"
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
      &lt;byte&gt;
    </text>
    <text
      x="184"
      y="60"
      fill={BLACK}
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

// Refinement 2b — stacked [byte] / boundless, works in square contexts
const Concept2Stacked = () => (
  <svg
    viewBox="0 0 280 160"
    width="280"
    height="160"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Stacked bracket wordmark"
  >
    <text
      x="140"
      y="55"
      fill={ACCENT}
      fontFamily="Geist Mono, ui-monospace, Menlo, monospace"
      fontSize="36"
      fontWeight="700"
      textAnchor="middle"
      dominantBaseline="central"
    >
      [byte]
    </text>
    <text
      x="140"
      y="108"
      fill={BLACK}
      fontFamily="Inter, system-ui, -apple-system, sans-serif"
      fontSize="44"
      fontWeight="800"
      textAnchor="middle"
      dominantBaseline="central"
      letterSpacing="-0.04em"
    >
      boundless
    </text>
  </svg>
);

// Refinement 2c — companion [b] mark for favicon/standalone use
const Concept2Companion = () => (
  <svg
    viewBox="0 0 120 120"
    width="120"
    height="120"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Companion [b] favicon mark"
  >
    <rect x="0" y="0" width="120" height="120" rx="26" fill={ACCENT} />
    <text
      x="60"
      y="62"
      fill={WHITE}
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

// ══════════════════════════════════════════════════════════════════
// SECTION 2 — Concept 4 refinements (scanner / signal mark)
// ══════════════════════════════════════════════════════════════════

// Original 3-ring radar — kept for side-by-side comparison
const Concept4Original = () => (
  <svg
    viewBox="0 0 120 120"
    width="120"
    height="120"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Original 3-ring radar"
  >
    <rect x="0" y="0" width="120" height="120" rx="26" fill={ACCENT} />
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

// Refinement 4a — Focused pulse. Single outward ring + solid center dot.
// Cleaner than 3 rings, reads as "hit/target/ping" not security dashboard.
const Concept4Pulse = () => (
  <svg
    viewBox="0 0 120 120"
    width="120"
    height="120"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Focused pulse"
  >
    <rect x="0" y="0" width="120" height="120" rx="26" fill={ACCENT} />
    {/* Outer pulse ring, subtle */}
    <circle
      cx="60"
      cy="60"
      r="40"
      fill="none"
      stroke={WHITE}
      strokeWidth="3"
      opacity="0.25"
    />
    {/* Main ring */}
    <circle
      cx="60"
      cy="60"
      r="24"
      fill="none"
      stroke={WHITE}
      strokeWidth="3.5"
    />
    {/* Solid core */}
    <circle cx="60" cy="60" r="10" fill={WHITE} />
  </svg>
);

// Refinement 4b — Crosshair reticle. Targeting energy, clearer "finding"
// metaphor than concentric rings.
const Concept4Crosshair = () => (
  <svg
    viewBox="0 0 120 120"
    width="120"
    height="120"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Crosshair reticle"
  >
    <rect x="0" y="0" width="120" height="120" rx="26" fill={ACCENT} />
    {/* Outer ring */}
    <circle
      cx="60"
      cy="60"
      r="32"
      fill="none"
      stroke={WHITE}
      strokeWidth="3"
    />
    {/* Crosshair arms (4 short lines extending through center) */}
    <line
      x1="60"
      y1="18"
      x2="60"
      y2="34"
      stroke={WHITE}
      strokeWidth="3"
      strokeLinecap="round"
    />
    <line
      x1="60"
      y1="86"
      x2="60"
      y2="102"
      stroke={WHITE}
      strokeWidth="3"
      strokeLinecap="round"
    />
    <line
      x1="18"
      y1="60"
      x2="34"
      y2="60"
      stroke={WHITE}
      strokeWidth="3"
      strokeLinecap="round"
    />
    <line
      x1="86"
      y1="60"
      x2="102"
      y2="60"
      stroke={WHITE}
      strokeWidth="3"
      strokeLinecap="round"
    />
    {/* Center dot */}
    <circle cx="60" cy="60" r="5" fill={WHITE} />
  </svg>
);

// Refinement 4c — Signal in noise. A 5x5 grid of dots where one is
// highlighted bright white. Literalizes the product's core pitch:
// finding the ONE lead worth pursuing out of many.
const Concept4Signal = () => {
  const cols = 5;
  const rows = 5;
  const spacing = 16;
  const startX = (120 - (cols - 1) * spacing) / 2; // 28
  const startY = (120 - (rows - 1) * spacing) / 2; // 28
  const highlightCol = 3;
  const highlightRow = 2;
  return (
    <svg
      viewBox="0 0 120 120"
      width="120"
      height="120"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Signal in noise grid"
    >
      <rect x="0" y="0" width="120" height="120" rx="26" fill={ACCENT} />
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: cols }).map((_, col) => {
          const isHighlight = row === highlightRow && col === highlightCol;
          return (
            <circle
              key={`${row}-${col}`}
              cx={startX + col * spacing}
              cy={startY + row * spacing}
              r={isHighlight ? 4.5 : 2}
              fill={WHITE}
              opacity={isHighlight ? 1 : 0.35}
            />
          );
        })
      )}
      {/* Subtle ring around the highlighted dot to emphasize it */}
      <circle
        cx={startX + highlightCol * spacing}
        cy={startY + highlightRow * spacing}
        r="10"
        fill="none"
        stroke={WHITE}
        strokeWidth="2"
        opacity="0.55"
      />
    </svg>
  );
};

// ══════════════════════════════════════════════════════════════════
// SECTION 3 — Original six (reference, for comparison)
// ══════════════════════════════════════════════════════════════════

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
      fill={BLACK}
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

const Concept3Mark = () => (
  <svg
    viewBox="0 0 160 120"
    width="160"
    height="120"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Concept 3 — B escaping boundary"
  >
    <rect x="0" y="6" width="112" height="108" rx="24" fill={ACCENT} />
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

const Concept5Mark = () => {
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
  const width = 4 * stride - gap;
  const height = 7 * stride - gap;
  const offsetX = (120 - width) / 2;
  const offsetY = (120 - height) / 2;
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

// ══════════════════════════════════════════════════════════════════
// Section composition
// ══════════════════════════════════════════════════════════════════

const sections: Section[] = [
  {
    eyebrow: "REFINEMENTS · CONCEPT 2",
    title: "Bracket wordmark",
    description:
      "The weakness of the original is no companion mark for favicon contexts. Three refinements explore different bracket treatments and a paired favicon glyph.",
    concepts: [
      {
        number: "ORIGINAL",
        title: "[byte]boundless",
        description:
          "Square brackets in mono, boundless in sans. The baseline — reference for comparing the refinements.",
        pros: ["Immediately reads as tech-native", "Strong typographic contrast"],
        cons: [
          "No symbolic mark for square contexts",
          "Square brackets feel slightly generic",
        ],
        svg: <Concept2Original />,
        wide: true,
      },
      {
        number: "2a",
        title: "Angle brackets",
        description:
          "<byte>boundless with HTML/tag energy. Same structure, stronger developer-specific read.",
        pros: [
          "Immediately recognizable to the target audience (web devs)",
          "More distinctive than square brackets",
          "Angle glyphs create natural forward motion",
        ],
        cons: [
          "Narrower read for non-developer prospects",
          "Angle bracket weight varies by font — needs careful font pairing",
        ],
        svg: <Concept2Angle />,
        wide: true,
      },
      {
        number: "2b",
        title: "Stacked lockup",
        description:
          "[byte] stacked over boundless. Fits square contexts (avatars, footer blocks) without needing a separate icon.",
        pros: [
          "Works in square contexts without a companion mark",
          "Boundless gets more visual weight as the primary word",
          "Still instantly legible",
        ],
        cons: [
          "Wastes horizontal space in header/sidebar contexts",
          "Two-line wordmarks are harder to scale",
        ],
        svg: <Concept2Stacked />,
      },
      {
        number: "2c",
        title: "Companion [b] mark",
        description:
          "Dedicated square mark with [b] inside, pairs with the bracket wordmark. Solves the favicon gap.",
        pros: [
          "Reuses the bracket motif from the wordmark for consistency",
          "Works as favicon, app icon, and social avatar",
          "Monospace [b] stays distinct at 16px",
        ],
        cons: [
          "Still depends on the full wordmark being strong",
          "Brackets at tiny sizes can look like noise",
        ],
        svg: <Concept2Companion />,
      },
    ],
  },
  {
    eyebrow: "REFINEMENTS · CONCEPT 4",
    title: "Scanner / signal mark",
    description:
      "The weakness of the 3-ring radar is that it reads as security/monitoring software. Three refinements pull away from the radar-dashboard metaphor toward lead-finding specifically.",
    concepts: [
      {
        number: "ORIGINAL",
        title: "3-ring radar",
        description:
          "Concentric rings + sweep line. The baseline — reference for comparing the refinements.",
        pros: ["Clearly 'scanning' energy", "Recognizable radar shape"],
        cons: [
          "Reads as security/monitoring (Sentry, Datadog)",
          "Sweep line makes it feel busy at small sizes",
        ],
        svg: <Concept4Original />,
      },
      {
        number: "4a",
        title: "Focused pulse",
        description:
          "One ring, one dim pulse, solid center. Stripped back from the dashboard read toward a clean 'hit' or 'ping' signal.",
        pros: [
          "Much cleaner at favicon size",
          "Focus shifts from 'scanning' to 'target found'",
          "Distinctive circular silhouette",
        ],
        cons: [
          "Abstract — still no letter reference",
          "Can read as a generic 'dot' or record button",
        ],
        svg: <Concept4Pulse />,
      },
      {
        number: "4b",
        title: "Crosshair reticle",
        description:
          "Viewfinder-style crosshair with a center dot. Swaps the radar metaphor for targeting / aim.",
        pros: [
          "Clear 'finding the right one' metaphor",
          "Distinct from SaaS monitoring marks",
          "Reads well at small sizes — four tick marks are legible",
        ],
        cons: [
          "Targeting imagery has weapon/military associations",
          "Can feel aggressive for a sales-tool brand",
        ],
        svg: <Concept4Crosshair />,
      },
      {
        number: "4c",
        title: "Signal in noise",
        description:
          "Grid of dim dots with one highlighted. The most literal expression of the brand promise: finding the one lead worth pursuing out of many.",
        pros: [
          "Directly literalizes the product's core pitch",
          "Unique in the category — no other SaaS uses this",
          "Instantly tells a story at any size",
        ],
        cons: [
          "More visually complex than a single-shape mark",
          "Highlighted dot position matters a lot — needs tuning",
        ],
        svg: <Concept4Signal />,
      },
    ],
  },
  {
    eyebrow: "REFERENCE · ORIGINAL SIX",
    title: "Other directions from round one",
    description:
      "The directions you passed on last round, kept here for comparison. You can swap one in if any of the refinements aren't landing.",
    concepts: [
      {
        number: "01",
        title: "Refined B mark",
        description: "Rounded square with a custom B in Inter Bold.",
        pros: ["Lowest risk", "Reads at 16px favicon"],
        cons: ["Most common direction"],
        svg: <Concept1Mark />,
      },
      {
        number: "★",
        title: "Mark + wordmark lockup",
        description: "Concept 1's mark paired with an Inter Bold wordmark.",
        pros: ["One lockup covers every surface"],
        cons: ["Still depends on the B mark being strong"],
        svg: <LockupMark />,
        wide: true,
      },
      {
        number: "03",
        title: "Boundary break",
        description: "B in a square with an arrow escaping past the edge.",
        pros: ["Direct visual metaphor for boundless"],
        cons: ["Arrow complicates favicon cropping"],
        svg: <Concept3Mark />,
        wide: true,
      },
      {
        number: "05",
        title: "Pixel-stack B",
        description: "B constructed from discrete squares.",
        pros: ["Clever, distinctive"],
        cons: ["Reads as retro/8-bit"],
        svg: <Concept5Mark />,
      },
      {
        number: "06",
        title: "B chevron",
        description: "B followed by a chevron suggesting forward motion.",
        pros: ["More personality than straight B"],
        cons: ["Dense at favicon size"],
        svg: <Concept6Mark />,
      },
    ],
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
      <div className="flex items-center justify-between mb-6">
        <p className="text-[10px] uppercase tracking-[0.15em] font-[family-name:var(--font-mono)] text-[var(--color-text-dim)]">
          {concept.number}
        </p>
        {concept.highlight && (
          <span className="text-[10px] uppercase tracking-[0.15em] font-semibold px-2 py-1 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
            {concept.highlight}
          </span>
        )}
      </div>

      <div className="flex items-center justify-center py-8 px-4 rounded-xl bg-white border border-[var(--color-border)]/50 mb-6 min-h-[200px]">
        {concept.svg}
      </div>

      <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight mb-2">
        {concept.title}
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
        {concept.description}
      </p>

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
      <div className="mb-12">
        <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-accent)] font-medium font-[family-name:var(--font-mono)] mb-2">
          Brand Review
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight mb-3">
          Logo Concepts
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-2xl">
          Refinements on concepts 2 (bracket wordmark) and 4 (scanner mark),
          with the originals kept for side-by-side comparison. Delete this
          page once a winner is picked.
        </p>
      </div>

      {sections.map((section, idx) => (
        <section
          key={section.title}
          className={idx > 0 ? "mt-16 pt-16 border-t border-[var(--color-border)]" : ""}
        >
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.15em] font-[family-name:var(--font-mono)] text-[var(--color-accent)] mb-2">
              {section.eyebrow}
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight mb-2">
              {section.title}
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-2xl">
              {section.description}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {section.concepts.map((c) => (
              <ConceptCard key={c.title} concept={c} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
