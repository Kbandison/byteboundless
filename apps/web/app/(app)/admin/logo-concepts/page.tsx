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
// SECTION 2 — Single B variants (distinct visual treatments)
// ══════════════════════════════════════════════════════════════════

// 1a — B in a circle. Different container shape — softer silhouette
// than the rounded square, more friendly/organic.
const SingleBCircle = () => (
  <svg
    viewBox="0 0 120 120"
    width="120"
    height="120"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="B in circle"
  >
    <circle cx="60" cy="60" r="58" fill={ACCENT} />
    <text
      x="60"
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
  </svg>
);

// 1b — Outlined B. Stroke-only B with no fill, on the blue square.
// Creates negative space and feels more open.
const SingleBOutline = () => (
  <svg
    viewBox="0 0 120 120"
    width="120"
    height="120"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="outlined B mark"
  >
    <rect
      x="3"
      y="3"
      width="114"
      height="114"
      rx="24"
      fill="none"
      stroke={ACCENT}
      strokeWidth="6"
    />
    <text
      x="60"
      y="60"
      fill={ACCENT}
      fontFamily="Inter, system-ui, -apple-system, sans-serif"
      fontSize="76"
      fontWeight="800"
      textAnchor="middle"
      dominantBaseline="central"
      letterSpacing="-0.04em"
    >
      B
    </text>
  </svg>
);

// 1c — B² (B-squared). Mathematical/semantic mark — two Bs in the
// name compressed into one symbol. The superscript 2 reads instantly.
const SingleBSquared = () => (
  <svg
    viewBox="0 0 120 120"
    width="120"
    height="120"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="B squared mark"
  >
    <rect x="0" y="0" width="120" height="120" rx="26" fill={ACCENT} />
    <text
      x="46"
      y="62"
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
    {/* Superscript 2 — smaller, raised, slightly offset right */}
    <text
      x="86"
      y="36"
      fill={WHITE}
      fontFamily="Inter, system-ui, -apple-system, sans-serif"
      fontSize="32"
      fontWeight="700"
      textAnchor="middle"
      dominantBaseline="central"
    >
      2
    </text>
  </svg>
);

// ══════════════════════════════════════════════════════════════════
// SECTION 3 — Double B variants (distinct visual treatments)
// ══════════════════════════════════════════════════════════════════

// 2a — bb tight. Two lowercase b's with aggressive negative kerning
// so they nearly fuse into one shape.
const DoubleBTight = () => (
  <svg
    viewBox="0 0 120 120"
    width="120"
    height="120"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="bb tight kern mark"
  >
    <rect x="0" y="0" width="120" height="120" rx="26" fill={ACCENT} />
    <text
      x="60"
      y="65"
      fill={WHITE}
      fontFamily="Inter, system-ui, -apple-system, sans-serif"
      fontSize="78"
      fontWeight="800"
      textAnchor="middle"
      dominantBaseline="central"
      letterSpacing="-0.18em"
    >
      bb
    </text>
  </svg>
);

// 2b — BB depth shadow. Two uppercase B's stacked with an offset
// so the back B reads as a soft shadow behind the front B.
const DoubleBDepth = () => (
  <svg
    viewBox="0 0 120 120"
    width="120"
    height="120"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="BB depth shadow mark"
  >
    <rect x="0" y="0" width="120" height="120" rx="26" fill={ACCENT} />
    {/* Back B — dimmer, offset down-right to act as the shadow */}
    <text
      x="68"
      y="68"
      fill={WHITE}
      fillOpacity="0.35"
      fontFamily="Inter, system-ui, -apple-system, sans-serif"
      fontSize="76"
      fontWeight="800"
      textAnchor="middle"
      dominantBaseline="central"
      letterSpacing="-0.04em"
    >
      B
    </text>
    {/* Front B — full white, normal position */}
    <text
      x="52"
      y="52"
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
  </svg>
);

// 2c — bb diagonal. Two lowercase b's staggered diagonally — one
// in the upper-left, one in the lower-right. Creates motion / step.
const DoubleBDiagonal = () => (
  <svg
    viewBox="0 0 120 120"
    width="120"
    height="120"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="bb diagonal stagger mark"
  >
    <rect x="0" y="0" width="120" height="120" rx="26" fill={ACCENT} />
    <text
      x="42"
      y="44"
      fill={WHITE}
      fontFamily="Inter, system-ui, -apple-system, sans-serif"
      fontSize="56"
      fontWeight="800"
      textAnchor="middle"
      dominantBaseline="central"
      letterSpacing="-0.04em"
    >
      b
    </text>
    <text
      x="78"
      y="78"
      fill={WHITE}
      fontFamily="Inter, system-ui, -apple-system, sans-serif"
      fontSize="56"
      fontWeight="800"
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
    title: "Favicon mark — single letter",
    description:
      "Three single-B treatments with distinct visual approaches. Each pulls away from the default 'letter on a rounded square' template in a different direction.",
    concepts: [
      {
        number: "1a",
        title: "B in circle",
        description:
          "Different container shape — circle instead of rounded square. Softer silhouette, more organic against the rest of the UI.",
        pros: [
          "Stands apart from generic SaaS rounded-square logos",
          "Friendly, organic feel",
          "Circle clips cleanly at any avatar size",
        ],
        cons: [
          "Less coherent with the existing rounded-square UI in the app sidebar",
          "Circle shape is less common for favicons",
        ],
        svg: <SingleBCircle />,
      },
      {
        number: "1b",
        title: "Outlined B",
        description:
          "Stroke-only B inside an outlined square — no fill. Inverts the relationship between mark and ground, leaving negative space for the letterform.",
        pros: [
          "Distinctive — most logos are filled, not outlined",
          "Lets the background show through (works on any color)",
          "Light, modern, restrained",
        ],
        cons: [
          "Less visual weight than a filled mark",
          "Outline strokes can blur at 16px favicon size",
        ],
        svg: <SingleBOutline />,
      },
      {
        number: "1c",
        title: "B² (B-squared)",
        description:
          "Mathematical 'B squared' — semantic for the two Bs in ByteBoundless compressed into one symbol. The superscript reads instantly as 'twice'.",
        pros: [
          "Semantically tied to the brand name in a clever way",
          "Distinctive — no other SaaS uses this construction",
          "Works as a piece of marketing copy too ('B²')",
        ],
        cons: [
          "May feel too clever / cute",
          "Superscript 2 gets small and risks vanishing at favicon size",
        ],
        svg: <SingleBSquared />,
      },
    ],
  },
  {
    eyebrow: "EXPLORATION · DOUBLE B",
    title: "Favicon mark — two letters",
    description:
      "Three double-B treatments. Each tries a different way to combine two letterforms into one cohesive mark — aggressive kerning, depth/shadow, or staggered placement.",
    concepts: [
      {
        number: "2a",
        title: "bb tight kern",
        description:
          "Two lowercase b's with aggressive negative letter-spacing so they nearly fuse into a single visual shape. The bowls overlap creating a custom ligature feel.",
        pros: [
          "Reads as a single, intentional mark — not just two letters",
          "Most type-driven of the double-B options",
          "Compact enough for favicon use",
        ],
        cons: [
          "Aggressive kerning can look like a typo if not executed well",
          "Letterform overlap may smudge at very small sizes",
        ],
        svg: <DoubleBTight />,
      },
      {
        number: "2b",
        title: "BB depth shadow",
        description:
          "Two uppercase B's stacked with an offset so the back one reads as a soft shadow behind the front. Creates dimensionality without literal 3D effects.",
        pros: [
          "Most dynamic of the double-B options",
          "Implies depth and layering — modern feel",
          "Both Bs are individually legible",
        ],
        cons: [
          "Drop-shadow style can feel dated if overdone",
          "Two letters compete for attention at small sizes",
        ],
        svg: <DoubleBDepth />,
      },
      {
        number: "2c",
        title: "bb diagonal",
        description:
          "Two lowercase b's staggered diagonally — one in the upper-left, one in the lower-right. The arrangement suggests motion and progression.",
        pros: [
          "Forward-motion energy fits the lead-finding pitch",
          "Most distinctive layout — no other brand does this",
          "Diagonal balance feels modern",
        ],
        cons: [
          "Less compact than other layouts",
          "Diagonal staggering can feel decorative rather than essential",
        ],
        svg: <DoubleBDiagonal />,
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
