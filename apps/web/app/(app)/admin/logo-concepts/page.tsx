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
  /** Optional highlight (selected, recommended, etc). */
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
// SECTION 1 — Selected directions (the keepers)
// ══════════════════════════════════════════════════════════════════

// Original [byte]boundless wordmark
const Wordmark = () => (
  <svg
    viewBox="0 0 360 120"
    width="360"
    height="120"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="[byte]boundless wordmark"
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

// Signal in noise — secondary accent mark
const SignalMark = () => {
  const cols = 5;
  const rows = 5;
  const spacing = 16;
  const startX = (120 - (cols - 1) * spacing) / 2;
  const startY = (120 - (rows - 1) * spacing) / 2;
  const highlightCol = 3;
  const highlightRow = 2;
  return (
    <svg
      viewBox="0 0 120 120"
      width="120"
      height="120"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Signal in noise mark"
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
// SECTION 2 — Single B (pure letterforms, no container)
// ══════════════════════════════════════════════════════════════════

// 1a — Solid B. Inter at heavy weight, blue, no container.
// The simplest possible mark — confidence comes from weight + color.
const SingleBSolid = () => (
  <svg
    viewBox="0 0 120 120"
    width="120"
    height="120"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="solid B mark"
  >
    <text
      x="60"
      y="64"
      fill={ACCENT}
      fontFamily="Inter, system-ui, -apple-system, sans-serif"
      fontSize="118"
      fontWeight="900"
      textAnchor="middle"
      dominantBaseline="central"
      letterSpacing="-0.05em"
    >
      B
    </text>
  </svg>
);

// 1b — Outlined B. Stroke-only letterform, no fill. The B is drawn
// by its outline, leaving the interior open as negative space.
// SVG text supports stroke + no fill via fill="none".
const SingleBOutline = () => (
  <svg
    viewBox="0 0 120 120"
    width="120"
    height="120"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="outlined B mark"
  >
    <text
      x="60"
      y="64"
      fill="none"
      stroke={ACCENT}
      strokeWidth="4"
      strokeLinejoin="round"
      fontFamily="Inter, system-ui, -apple-system, sans-serif"
      fontSize="110"
      fontWeight="800"
      textAnchor="middle"
      dominantBaseline="central"
      letterSpacing="-0.04em"
    >
      B
    </text>
  </svg>
);

// 1c — B with signal accent. A clean B with a small accent dot
// positioned to its upper-right, echoing the signal-in-noise mark.
// Ties the favicon visually to the secondary accent mark.
const SingleBAccent = () => (
  <svg
    viewBox="0 0 140 120"
    width="140"
    height="120"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="B with signal accent dot"
  >
    <text
      x="56"
      y="64"
      fill={ACCENT}
      fontFamily="Inter, system-ui, -apple-system, sans-serif"
      fontSize="108"
      fontWeight="900"
      textAnchor="middle"
      dominantBaseline="central"
      letterSpacing="-0.05em"
    >
      B
    </text>
    {/* Accent dot — positioned to the upper-right, the same vibe
        as the highlighted dot in the signal-in-noise mark */}
    <circle cx="120" cy="22" r="9" fill={ACCENT} />
  </svg>
);

// ══════════════════════════════════════════════════════════════════
// SECTION 3 — Double B (pure letterforms, no container)
// ══════════════════════════════════════════════════════════════════

// 2a — bb tight kern. Two lowercase b's with aggressive negative
// letter-spacing so they nearly fuse into one shape. No container.
const DoubleBTight = () => (
  <svg
    viewBox="0 0 200 120"
    width="200"
    height="120"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="bb tight kern mark"
  >
    <text
      x="100"
      y="64"
      fill={ACCENT}
      fontFamily="Inter, system-ui, -apple-system, sans-serif"
      fontSize="118"
      fontWeight="900"
      textAnchor="middle"
      dominantBaseline="central"
      letterSpacing="-0.18em"
    >
      bb
    </text>
  </svg>
);

// 2b — B mirrored. Uppercase B with a horizontally-mirrored B
// next to it, forming a symmetric monogram. The flip is done with
// an SVG transform on a group containing the second text node.
const DoubleBMirror = () => (
  <svg
    viewBox="0 0 200 120"
    width="200"
    height="120"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="B mirrored monogram"
  >
    {/* Right-facing B */}
    <text
      x="60"
      y="64"
      fill={ACCENT}
      fontFamily="Inter, system-ui, -apple-system, sans-serif"
      fontSize="108"
      fontWeight="900"
      textAnchor="middle"
      dominantBaseline="central"
      letterSpacing="-0.05em"
    >
      B
    </text>
    {/* Mirrored B — flip horizontally around its own center */}
    <g transform="translate(280 0) scale(-1 1)">
      <text
        x="140"
        y="64"
        fill={ACCENT}
        fontFamily="Inter, system-ui, -apple-system, sans-serif"
        fontSize="108"
        fontWeight="900"
        textAnchor="middle"
        dominantBaseline="central"
        letterSpacing="-0.05em"
      >
        B
      </text>
    </g>
  </svg>
);

// 2c — bb stacked vertically. Two lowercase b's stacked vertically.
// Compact vertical monogram, naturally fits a square favicon area.
const DoubleBStacked = () => (
  <svg
    viewBox="0 0 100 180"
    width="100"
    height="180"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="bb stacked vertical mark"
  >
    <text
      x="50"
      y="50"
      fill={ACCENT}
      fontFamily="Inter, system-ui, -apple-system, sans-serif"
      fontSize="86"
      fontWeight="900"
      textAnchor="middle"
      dominantBaseline="central"
      letterSpacing="-0.04em"
    >
      b
    </text>
    <text
      x="50"
      y="130"
      fill={ACCENT}
      fontFamily="Inter, system-ui, -apple-system, sans-serif"
      fontSize="86"
      fontWeight="900"
      textAnchor="middle"
      dominantBaseline="central"
      letterSpacing="-0.04em"
    >
      b
    </text>
  </svg>
);

// ══════════════════════════════════════════════════════════════════
// Section composition
// ══════════════════════════════════════════════════════════════════

const sections: Section[] = [
  {
    eyebrow: "SELECTED · KEEPERS",
    title: "Locked direction",
    description:
      "These are the two pieces you committed to. The bracket wordmark is the primary brand expression. The signal-in-noise mark serves as a secondary accent (loading states, social avatars, empty states). The favicon mark is still TBD — that's what the next two sections are for.",
    concepts: [
      {
        number: "PRIMARY",
        title: "[byte]boundless wordmark",
        description:
          "Primary brand expression. Mono brackets, sans body. Use in the sidebar header, footer, marketing hero, email headers, and OG card body.",
        pros: [
          "Distinctive and instantly tech-native",
          "Strong typographic contrast between mono and sans",
          "No competition in the SaaS category",
        ],
        cons: ["Wide aspect ratio — needs the favicon mark for square contexts"],
        svg: <Wordmark />,
        wide: true,
        highlight: "PRIMARY",
      },
      {
        number: "SECONDARY",
        title: "Signal in noise",
        description:
          "Secondary accent mark. Use it where the wordmark would be too literal — loading states, empty states, social avatars, marketing illustrations, the OG image background.",
        pros: [
          "Tells the product story in one glance",
          "Unique in the SaaS category",
          "Works at any size",
        ],
        cons: ["Doesn't say 'B' or 'byte' — abstract"],
        svg: <SignalMark />,
        highlight: "ACCENT",
      },
    ],
  },
  {
    eyebrow: "EXPLORATION · SINGLE B",
    title: "Pure letterform — single B",
    description:
      "Three single-B marks with no container, no background. Just the letter (and in one case a small accent) sitting in space. Like Linear, Notion, or Stripe — the mark IS the letterform.",
    concepts: [
      {
        number: "1a",
        title: "Solid B",
        description:
          "Inter at black weight (900), in accent blue. The simplest possible mark — confidence comes from the weight and color, not from a frame.",
        pros: [
          "Maximum weight and presence",
          "Reads instantly at any size",
          "Closest to the Vercel/Linear school of letterform marks",
        ],
        cons: [
          "Generic until customized — many brands use a heavy single letter",
          "Lives or dies on the typeface choice",
        ],
        svg: <SingleBSolid />,
      },
      {
        number: "1b",
        title: "Outlined B",
        description:
          "Stroke-only letterform with no fill — the B is drawn by its outline, leaving the interior open as negative space. Light and confident.",
        pros: [
          "Distinctive — most logos are filled, not outlined",
          "Lets the background color show through",
          "Modern, restrained, design-conscious feel",
        ],
        cons: [
          "Stroke can blur at 16px favicon",
          "Less visual weight than a solid mark",
        ],
        svg: <SingleBOutline />,
      },
      {
        number: "1c",
        title: "B with signal accent",
        description:
          "A clean B with a small accent dot positioned to its upper-right. The dot intentionally echoes the highlighted dot in the signal-in-noise mark, tying the favicon visually to the secondary accent.",
        pros: [
          "Visually links the favicon to the signal-in-noise accent mark",
          "The accent dot adds a custom touch to a generic letterform",
          "Works at small sizes — the dot is bold enough to read",
        ],
        cons: [
          "Wider than a single letter, slightly less compact",
          "Accent dot meaning is implicit, not obvious",
        ],
        svg: <SingleBAccent />,
      },
    ],
  },
  {
    eyebrow: "EXPLORATION · DOUBLE B",
    title: "Pure letterform — double B",
    description:
      "Three double-B marks with no container. Each leans into a different way to combine the letterforms — aggressive kerning, mirroring, or vertical stacking.",
    concepts: [
      {
        number: "2a",
        title: "bb tight kern",
        description:
          "Two lowercase b's at black weight with aggressive negative letter-spacing so they nearly fuse into one shape. No background — the letterforms ARE the mark.",
        pros: [
          "Reads as a single intentional mark, not two letters glued together",
          "Most type-driven of the double-B options",
          "Compact even without a container",
        ],
        cons: [
          "Aggressive kerning can read as a typo if not refined",
          "Letterform overlap may smudge at small sizes",
        ],
        svg: <DoubleBTight />,
      },
      {
        number: "2b",
        title: "B mirrored",
        description:
          "Uppercase B with a horizontally-mirrored B next to it, forming a symmetric monogram. The two letterforms create a butterfly/diamond silhouette.",
        pros: [
          "Truly distinctive — no other brand uses this construction",
          "Symmetric shape feels balanced and intentional",
          "Reads as a custom monogram, not typed text",
        ],
        cons: [
          "Mirrored B doesn't read as the letter B anymore — abstract",
          "Wide aspect ratio — needs cropping for square contexts",
        ],
        svg: <DoubleBMirror />,
      },
      {
        number: "2c",
        title: "bb stacked",
        description:
          "Two lowercase b's stacked vertically. Compact, naturally fits square favicon contexts, and the vertical arrangement reads as a custom monogram.",
        pros: [
          "Naturally fits square favicon space",
          "Vertical stack is unusual for letter marks — distinctive",
          "Both b's stay individually legible",
        ],
        cons: [
          "Vertical orientation is awkward for header/sidebar lockups",
          "Two letters competing in a small space",
        ],
        svg: <DoubleBStacked />,
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
          Selected directions plus six favicon-mark explorations — three
          single-B variants and three double-B variants. Pick a favicon mark
          to complete the system.
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
