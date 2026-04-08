"use client";

import { cn } from "@/lib/utils";

const MOCK_LEADS = [
  {
    name: "Sunrise Dental Care",
    category: "Dentist",
    score: 92,
    tech: "godaddy",
    techLabel: "GoDaddy",
    emails: 2,
    socials: 1,
    rating: 3.8,
  },
  {
    name: "Premier Plumbing Co",
    category: "Plumber",
    score: 87,
    tech: "wix",
    techLabel: "Wix",
    emails: 1,
    socials: 3,
    rating: 4.2,
  },
  {
    name: "Green Thumb Landscaping",
    category: "Lawn Care",
    score: 81,
    tech: "squarespace",
    techLabel: "Squarespace",
    emails: 3,
    socials: 2,
    rating: 4.5,
  },
  {
    name: "Comfort Zone HVAC",
    category: "HVAC",
    score: 74,
    tech: "wordpress",
    techLabel: "WordPress",
    emails: 1,
    socials: 4,
    rating: 4.1,
  },
  {
    name: "Atlas Moving Services",
    category: "Movers",
    score: 68,
    tech: "weebly",
    techLabel: "Weebly",
    emails: 2,
    socials: 2,
    rating: 3.9,
  },
];

const TECH_COLORS: Record<string, string> = {
  wix: "bg-yellow-500/15 text-yellow-700",
  squarespace: "bg-neutral-700/15 text-neutral-700",
  wordpress: "bg-blue-600/15 text-blue-700",
  godaddy: "bg-orange-500/15 text-orange-700",
  weebly: "bg-orange-400/15 text-orange-600",
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
      : score >= 50
        ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
        : "bg-neutral-400/15 text-neutral-500 border-neutral-400/30";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-10 h-7 rounded text-xs font-semibold font-[family-name:var(--font-mono)] border",
        color
      )}
    >
      {score}
    </span>
  );
}

export function HeroMockup() {
  return (
    <div className="relative">
      {/* Glow effect behind the card */}
      <div className="absolute -inset-4 bg-[var(--color-accent-4)] rounded-3xl blur-2xl pointer-events-none" />

      {/* Browser chrome wrapper */}
      <div className="relative bg-[var(--color-bg-tertiary)] rounded-xl border border-[var(--color-border)] shadow-2xl shadow-black/5 overflow-hidden">
        {/* Window bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[var(--color-border)]" />
            <div className="w-3 h-3 rounded-full bg-[var(--color-border)]" />
            <div className="w-3 h-3 rounded-full bg-[var(--color-border)]" />
          </div>
          <div className="flex-1 mx-8">
            <div className="bg-[var(--color-bg-primary)] rounded-md px-3 py-1 text-xs text-[var(--color-text-dim)] font-[family-name:var(--font-mono)] text-center">
              byteboundless.com/search/results
            </div>
          </div>
        </div>

        {/* Table header */}
        <div className="px-4 py-3 border-b border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold font-[family-name:var(--font-display)]">
                Plumbers in Austin, TX
              </h3>
              <p className="text-xs text-[var(--color-text-dim)] mt-0.5">
                47 results &middot; 12 hot leads
              </p>
            </div>
            <div className="hidden sm:flex gap-2">
              <span className="text-[10px] px-2.5 py-1 rounded-md bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] font-medium">
                Export CSV
              </span>
              <span className="text-[10px] px-2.5 py-1 rounded-md bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium">
                Save List
              </span>
            </div>
          </div>
        </div>

        {/* Column headers — desktop */}
        <div className="hidden sm:grid grid-cols-[44px_1fr_80px_72px_48px_48px] gap-2 px-4 py-2 text-[10px] uppercase tracking-wider text-[var(--color-text-dim)] font-medium border-b border-[var(--color-border)]/50">
          <span>Score</span>
          <span>Business</span>
          <span>Tech</span>
          <span>Rating</span>
          <span className="text-center">@</span>
          <span className="text-center">Em</span>
        </div>

        {/* Rows — desktop */}
        <div className="hidden sm:block divide-y divide-[var(--color-border)]/50">
          {MOCK_LEADS.map((lead, i) => (
            <div
              key={i}
              className="grid grid-cols-[44px_1fr_80px_72px_48px_48px] gap-2 px-4 py-2.5 items-center hover:bg-[var(--color-bg-secondary)]/30 transition-colors duration-200"
            >
              <ScoreBadge score={lead.score} />
              <div>
                <p className="text-xs font-medium truncate">{lead.name}</p>
                <p className="text-[10px] text-[var(--color-text-dim)]">
                  {lead.category}
                </p>
              </div>
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded font-medium w-fit",
                  TECH_COLORS[lead.tech]
                )}
              >
                {lead.techLabel}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-amber-500 text-[10px]">&#9733;</span>
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {lead.rating}
                </span>
              </div>
              <span className="text-xs text-[var(--color-text-secondary)] text-center">
                {lead.socials}
              </span>
              <span className="text-xs text-[var(--color-text-secondary)] text-center">
                {lead.emails}
              </span>
            </div>
          ))}
        </div>

        {/* Rows — mobile (simplified cards) */}
        <div className="sm:hidden divide-y divide-[var(--color-border)]/50">
          {MOCK_LEADS.slice(0, 3).map((lead, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <ScoreBadge score={lead.score} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{lead.name}</p>
                <p className="text-[10px] text-[var(--color-text-dim)]">
                  {lead.category}
                </p>
              </div>
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded font-medium shrink-0",
                  TECH_COLORS[lead.tech]
                )}
              >
                {lead.techLabel}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom fade */}
        <div className="h-8 bg-gradient-to-t from-[var(--color-bg-tertiary)] to-transparent" />
      </div>
    </div>
  );
}
