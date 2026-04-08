"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { use } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Mail,
  Share2,
  Star,
  Download,
  ChevronDown,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TECH_STACK_COLORS, getScoreColor } from "@/lib/constants";

interface MockBusiness {
  id: string;
  name: string;
  category: string;
  website: string;
  score: number;
  tech: string;
  techLabel: string;
  emails: number;
  socials: number;
  rating: number;
  reviews: number;
  address: string;
}

const MOCK_BUSINESSES: MockBusiness[] = [
  { id: "1", name: "Sunrise Dental Care", category: "Dentist", website: "sunrisedental.com", score: 92, tech: "godaddy", techLabel: "GoDaddy", emails: 2, socials: 1, rating: 3.8, reviews: 24, address: "123 Main St, Austin, TX" },
  { id: "2", name: "Premier Plumbing Co", category: "Plumber", website: "premierplumbing.net", score: 87, tech: "wix", techLabel: "Wix", emails: 1, socials: 3, rating: 4.2, reviews: 67, address: "456 Oak Ave, Austin, TX" },
  { id: "3", name: "Green Thumb Landscaping", category: "Lawn Care", website: "greenthumbaustin.com", score: 81, tech: "squarespace", techLabel: "Squarespace", emails: 3, socials: 2, rating: 4.5, reviews: 112, address: "789 Elm Dr, Austin, TX" },
  { id: "4", name: "Comfort Zone HVAC", category: "HVAC", website: "comfortzonehvac.com", score: 74, tech: "wordpress", techLabel: "WordPress", emails: 1, socials: 4, rating: 4.1, reviews: 89, address: "321 Pine Rd, Austin, TX" },
  { id: "5", name: "Atlas Moving Services", category: "Movers", website: "atlasmoves.com", score: 68, tech: "weebly", techLabel: "Weebly", emails: 2, socials: 2, rating: 3.9, reviews: 45, address: "654 Cedar Ln, Austin, TX" },
  { id: "6", name: "Crystal Clear Windows", category: "Window Cleaning", website: "crystalclearwin.com", score: 94, tech: "godaddy", techLabel: "GoDaddy", emails: 1, socials: 0, rating: 3.2, reviews: 8, address: "111 Birch Ct, Austin, TX" },
  { id: "7", name: "Quick Fix Electric", category: "Electrician", website: "quickfixelectric.net", score: 83, tech: "wix", techLabel: "Wix", emails: 2, socials: 1, rating: 4.4, reviews: 156, address: "222 Maple St, Austin, TX" },
  { id: "8", name: "Sparkle Clean Maids", category: "Cleaning", website: "sparkleclean.biz", score: 78, tech: "godaddy", techLabel: "GoDaddy", emails: 1, socials: 2, rating: 4.0, reviews: 33, address: "333 Walnut Ave, Austin, TX" },
  { id: "9", name: "Austin Pet Grooming", category: "Pet Grooming", website: "austinpetgroom.com", score: 71, tech: "wordpress", techLabel: "WordPress", emails: 3, socials: 5, rating: 4.7, reviews: 201, address: "444 Spruce Dr, Austin, TX" },
  { id: "10", name: "Lone Star Roofing", category: "Roofing", website: "lonestaroof.com", score: 89, tech: "weebly", techLabel: "Weebly", emails: 1, socials: 1, rating: 3.6, reviews: 18, address: "555 Ash Blvd, Austin, TX" },
];

type SortKey = "score" | "name" | "rating" | "reviews" | "emails" | "socials";
type SortDir = "asc" | "desc";

function ScoreBadge({ score }: { score: number }) {
  const colors = getScoreColor(score);
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-12 h-8 rounded-md text-xs font-bold font-[family-name:var(--font-mono)] border",
        colors.bg,
        colors.text,
        colors.border
      )}
    >
      {score}
    </span>
  );
}

function TechChip({ tech, label }: { tech: string; label: string }) {
  const colors = TECH_STACK_COLORS[tech] || TECH_STACK_COLORS.unknown;
  return (
    <span
      className={cn(
        "inline-flex items-center text-[11px] px-2 py-0.5 rounded font-medium",
        colors.bg,
        colors.text
      )}
    >
      {label}
    </span>
  );
}

function SortButton({
  label,
  sortKey,
  currentSort,
  currentDir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const isActive = currentSort === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={cn(
        "flex items-center gap-1 text-[11px] uppercase tracking-wider font-medium transition-colors",
        isActive
          ? "text-[var(--color-accent)]"
          : "text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)]"
      )}
    >
      {label}
      {isActive ? (
        currentDir === "desc" ? (
          <ArrowDown className="w-3 h-3" />
        ) : (
          <ArrowUp className="w-3 h-3" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-40" />
      )}
    </button>
  );
}

export default function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [techFilter, setTechFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = useMemo(() => {
    let filtered = [...MOCK_BUSINESSES];

    if (techFilter.length > 0) {
      filtered = filtered.filter((b) => techFilter.includes(b.tech));
    }

    filtered.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return filtered;
  }, [sortKey, sortDir, techFilter]);

  const hotCount = MOCK_BUSINESSES.filter((b) => b.score >= 80).length;

  const availableTechs = [
    ...new Set(MOCK_BUSINESSES.map((b) => b.tech)),
  ].map((tech) => ({
    key: tech,
    label: MOCK_BUSINESSES.find((b) => b.tech === tech)?.techLabel || tech,
  }));

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
            Plumbers in Austin, TX
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {MOCK_BUSINESSES.length} results &middot;{" "}
            <span className="text-emerald-600 font-medium">{hotCount} hot leads</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all duration-300",
              showFilters
                ? "border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent)]/5"
                : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]"
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
            {techFilter.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-[var(--color-accent)] text-white text-[10px] flex items-center justify-center">
                {techFilter.length}
              </span>
            )}
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] transition-all duration-300">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="mb-6 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
          <p className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-3">
            Tech Stack
          </p>
          <div className="flex flex-wrap gap-2">
            {availableTechs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() =>
                  setTechFilter((prev) =>
                    prev.includes(key)
                      ? prev.filter((t) => t !== key)
                      : [...prev, key]
                  )
                }
                className={cn(
                  "text-xs px-3 py-1.5 rounded-md border transition-all duration-200",
                  techFilter.includes(key)
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                    : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]"
                )}
              >
                {label}
              </button>
            ))}
            {techFilter.length > 0 && (
              <button
                onClick={() => setTechFilter([])}
                className="text-xs px-3 py-1.5 text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)]"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] overflow-hidden">
        {/* Column headers */}
        <div className="hidden md:grid grid-cols-[56px_1fr_90px_80px_60px_60px_72px_40px] gap-3 px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/30">
          <SortButton label="Score" sortKey="score" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
          <SortButton label="Business" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
          <span className="text-[11px] uppercase tracking-wider text-[var(--color-text-dim)] font-medium">Tech</span>
          <SortButton label="Rating" sortKey="rating" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
          <SortButton label="Email" sortKey="emails" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
          <SortButton label="Social" sortKey="socials" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
          <SortButton label="Reviews" sortKey="reviews" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
          <span />
        </div>

        {/* Rows */}
        <div className="divide-y divide-[var(--color-border)]/50">
          {sorted.map((biz) => (
            <Link
              key={biz.id}
              href={`/search/${id}/results/${biz.id}`}
              className="grid grid-cols-1 md:grid-cols-[56px_1fr_90px_80px_60px_60px_72px_40px] gap-3 px-5 py-4 items-center hover:bg-[var(--color-bg-secondary)]/30 transition-colors duration-200 cursor-pointer group"
            >
              {/* Score */}
              <div>
                <ScoreBadge score={biz.score} />
              </div>

              {/* Business info */}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-[var(--color-accent)] transition-colors duration-200">
                  {biz.name}
                </p>
                <p className="text-xs text-[var(--color-text-dim)] truncate">
                  {biz.category} &middot; {biz.address}
                </p>
              </div>

              {/* Tech */}
              <div>
                <TechChip tech={biz.tech} label={biz.techLabel} />
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {biz.rating}
                </span>
              </div>

              {/* Emails */}
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[var(--color-text-dim)]" />
                <span className="text-sm font-[family-name:var(--font-mono)] text-[var(--color-text-secondary)]">
                  {biz.emails}
                </span>
              </div>

              {/* Socials */}
              <div className="flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-[var(--color-text-dim)]" />
                <span className="text-sm font-[family-name:var(--font-mono)] text-[var(--color-text-secondary)]">
                  {biz.socials}
                </span>
              </div>

              {/* Reviews */}
              <span className="text-sm font-[family-name:var(--font-mono)] text-[var(--color-text-secondary)]">
                {biz.reviews}
              </span>

              {/* External link */}
              <div className="flex justify-end">
                <ExternalLink className="w-4 h-4 text-[var(--color-text-dim)] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
