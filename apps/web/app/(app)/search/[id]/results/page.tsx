"use client";

import { useState, useMemo, useEffect } from "react";
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
  Filter,
  Loader2,
  Phone,
  Bookmark,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HelpTip } from "@/components/ui/help-tip";
import { usePlan, isPaidPlan } from "@/hooks/use-plan";
import { TECH_STACK_COLORS, getScoreColor } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

interface BusinessRow {
  id: string;
  name: string;
  category: string | null;
  website: string | null;
  phone: string | null;
  score: number;
  tech: string;
  techLabel: string;
  emails: number;
  emailList: string[];
  socials: number;
  rating: number;
  reviews: number;
  address: string | null;
}

function parseBusiness(raw: Record<string, unknown>): BusinessRow {
  const enrichment = raw.enrichment as Record<string, unknown> | null;
  const techStack = (enrichment?.techStack as string[]) ?? [];
  const primaryTech = techStack[0]?.toLowerCase().replace("godaddybuilder", "godaddy").replace("nextjs", "nextjs") ?? "unknown";
  const bizEmails = (enrichment?.emails as string[]) ?? [];
  const devEmails = (enrichment?.developerContacts as string[]) ?? [];
  const allEmails = [...bizEmails, ...devEmails];
  const socials = enrichment?.socials as Record<string, string> | null;

  return {
    id: raw.id as string,
    name: raw.name as string,
    category: raw.category as string | null,
    website: raw.website as string | null,
    phone: raw.phone as string | null,
    score: raw.lead_score as number,
    tech: primaryTech,
    techLabel: techStack[0] ?? "Unknown",
    emails: allEmails.length,
    emailList: allEmails,
    socials: Object.keys(socials ?? {}).length,
    rating: raw.rating as number ?? 0,
    reviews: raw.reviews as number ?? 0,
    address: raw.address as string | null,
  };
}

type SortKey = "score" | "name" | "rating" | "reviews" | "emails" | "socials" | "phone";
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
  const plan = usePlan();
  const paid = isPaidPlan(plan);
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [jobQuery, setJobQuery] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [savedBizIds, setSavedBizIds] = useState<Set<string>>(new Set());
  const [contactedBizIds, setContactedBizIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [techFilter, setTechFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [scoreMin, setScoreMin] = useState(0);
  const [filterHasPhone, setFilterHasPhone] = useState(false);
  const [filterHasEmail, setFilterHasEmail] = useState(false);
  const [filterHasWebsite, setFilterHasWebsite] = useState(false);
  const [filterSaved, setFilterSaved] = useState(false);
  const [filterContacted, setFilterContacted] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      // Fetch job info
      const { data: job } = await supabase.from("scrape_jobs").select("query, location").eq("id", id).single();
      if (job) {
        const j = job as Record<string, unknown>;
        setJobQuery(j.query as string);
        setJobLocation(j.location as string);
      }

      // Fetch businesses
      const { data } = await supabase
        .from("businesses")
        .select("*")
        .eq("job_id", id)
        .order("lead_score", { ascending: false });

      const parsed = ((data ?? []) as Record<string, unknown>[]).map(parseBusiness);
      setBusinesses(parsed);

      // Fetch saved/contacted status for these businesses
      const bizIds = parsed.map((b) => b.id);
      if (bizIds.length > 0) {
        const { data: items } = await supabase
          .from("saved_list_items")
          .select("business_id, status")
          .in("business_id", bizIds);

        const saved = new Set<string>();
        const contacted = new Set<string>();
        ((items ?? []) as { business_id: string; status: string }[]).forEach((item) => {
          saved.add(item.business_id);
          if (item.status === "contacted") contacted.add(item.business_id);
        });
        setSavedBizIds(saved);
        setContactedBizIds(contacted);
      }

      setLoading(false);
    }
    fetchData();
  }, [id]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const activeFilterCount = [
    techFilter.length > 0,
    scoreMin > 0,
    filterHasPhone,
    filterHasEmail,
    filterHasWebsite,
    filterSaved,
    filterContacted,
  ].filter(Boolean).length;

  const sorted = useMemo(() => {
    let filtered = [...businesses];

    if (techFilter.length > 0) {
      filtered = filtered.filter((b) => techFilter.includes(b.tech));
    }
    if (scoreMin > 0) {
      filtered = filtered.filter((b) => b.score >= scoreMin);
    }
    if (filterHasPhone) {
      filtered = filtered.filter((b) => !!b.phone);
    }
    if (filterHasEmail) {
      filtered = filtered.filter((b) => b.emails > 0);
    }
    if (filterHasWebsite) {
      filtered = filtered.filter((b) => !!b.website);
    }
    if (filterSaved) {
      filtered = filtered.filter((b) => savedBizIds.has(b.id));
    }
    if (filterContacted) {
      filtered = filtered.filter((b) => contactedBizIds.has(b.id));
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
  }, [businesses, sortKey, sortDir, techFilter, scoreMin, filterHasPhone, filterHasEmail, filterHasWebsite, filterSaved, filterContacted, savedBizIds, contactedBizIds]);

  const hotCount = businesses.filter((b) => b.score >= 80).length;

  const availableTechs = [
    ...new Set(businesses.map((b) => b.tech)),
  ].map((tech) => ({
    key: tech,
    label: businesses.find((b) => b.tech === tech)?.techLabel || tech,
  }));

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin mb-4" />
        <p className="text-sm text-[var(--color-text-secondary)]">Loading results...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
            {jobQuery} in {jobLocation}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {businesses.length} results &middot;{" "}
            <span className="text-emerald-600 font-medium">{hotCount} hot leads</span>
            <HelpTip text="Hot leads have a score of 80+, meaning they have strong signals that they need a website rebuild — outdated builders, no mobile support, stale content, etc." />
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
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[var(--color-accent)] text-white text-[10px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {paid ? (
            <button
              onClick={() => {
                const headers = ["Score", "Name", "Category", "Website", "Phone", "Emails", "Tech", "Socials", "Rating", "Reviews", "Address"];
                const rows = sorted.map((b) =>
                  [b.score, b.name, b.category ?? "", b.website ?? "", b.phone ?? "", b.emailList.join("; "), b.techLabel, b.socials, b.rating, b.reviews, b.address ?? ""]
                    .map((v) => { const s = String(v).replace(/"/g, '""'); return /[",\n]/.test(s) ? `"${s}"` : s; })
                    .join(",")
                );
                const csv = [headers.join(","), ...rows].join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${jobQuery}-${jobLocation}-results.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] transition-all duration-300"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          ) : (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-[var(--color-border)] text-sm text-[var(--color-text-dim)] hover:border-[var(--color-accent)]/30 hover:text-[var(--color-accent)] transition-all duration-300"
            >
              <Lock className="w-3.5 h-3.5" />
              Export CSV
            </Link>
          )}
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="mb-6 p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] space-y-5">
          {/* Score range */}
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-2">Minimum Score</p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={scoreMin}
                onChange={(e) => setScoreMin(Number(e.target.value))}
                className="flex-1 accent-[var(--color-accent)]"
              />
              <span className="text-xs font-[family-name:var(--font-mono)] text-[var(--color-text-secondary)] w-8 text-right">{scoreMin}</span>
            </div>
          </div>

          {/* Toggle filters */}
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-2">Requirements</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Has Phone", active: filterHasPhone, toggle: () => setFilterHasPhone(!filterHasPhone) },
                { label: "Has Email", active: filterHasEmail, toggle: () => setFilterHasEmail(!filterHasEmail) },
                { label: "Has Website", active: filterHasWebsite, toggle: () => setFilterHasWebsite(!filterHasWebsite) },
                { label: "Saved", active: filterSaved, toggle: () => setFilterSaved(!filterSaved) },
                { label: "Contacted", active: filterContacted, toggle: () => setFilterContacted(!filterContacted) },
              ].map((f) => (
                <button
                  key={f.label}
                  onClick={f.toggle}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-md border transition-all duration-200",
                    f.active
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tech stack */}
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-2">Tech Stack</p>
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
            </div>
          </div>

          {/* Clear all */}
          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setTechFilter([]);
                setScoreMin(0);
                setFilterHasPhone(false);
                setFilterHasEmail(false);
                setFilterHasWebsite(false);
                setFilterSaved(false);
                setFilterContacted(false);
              }}
              className="text-xs text-[var(--color-accent)] hover:underline"
            >
              Clear all filters
            </button>
          )}

          <p className="text-xs text-[var(--color-text-dim)]">
            Showing {sorted.length} of {businesses.length} results
          </p>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] overflow-hidden">
        {/* Column headers */}
        <div className="hidden md:grid grid-cols-[56px_1fr_90px_72px_60px_60px_60px_72px_40px] gap-3 px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/30">
          <SortButton label="Score" sortKey="score" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
          <SortButton label="Business" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
          <span className="text-[11px] uppercase tracking-wider text-[var(--color-text-dim)] font-medium">Tech</span>
          <SortButton label="Rating" sortKey="rating" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
          <span className="text-[11px] uppercase tracking-wider text-[var(--color-text-dim)] font-medium">Phone</span>
          <SortButton label="Email" sortKey="emails" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
          <SortButton label="Social" sortKey="socials" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
          <SortButton label="Reviews" sortKey="reviews" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
          <span />
        </div>

        {/* Desktop rows */}
        <div className="hidden md:block divide-y divide-[var(--color-border)]/50">
          {sorted.map((biz) => (
            <Link
              key={biz.id}
              href={`/search/${id}/results/${biz.id}`}
              className="grid grid-cols-[56px_1fr_90px_72px_60px_60px_60px_72px_40px] gap-3 px-5 py-4 items-center hover:bg-[var(--color-bg-secondary)]/30 transition-colors duration-200 cursor-pointer group"
            >
              <div><ScoreBadge score={biz.score} /></div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate group-hover:text-[var(--color-accent)] transition-colors duration-200">{biz.name}</p>
                  {contactedBizIds.has(biz.id) && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                  {savedBizIds.has(biz.id) && !contactedBizIds.has(biz.id) && <Bookmark className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />}
                </div>
                <p className="text-xs text-[var(--color-text-dim)] truncate">{biz.category} &middot; {biz.address}</p>
              </div>
              <div><TechChip tech={biz.tech} label={biz.techLabel} /></div>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="text-sm text-[var(--color-text-secondary)]">{biz.rating}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {biz.phone ? <Phone className="w-3.5 h-3.5 text-emerald-500" /> : <Phone className="w-3.5 h-3.5 text-[var(--color-text-dim)] opacity-30" />}
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[var(--color-text-dim)]" />
                <span className="text-sm font-[family-name:var(--font-mono)] text-[var(--color-text-secondary)]">{biz.emails}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-[var(--color-text-dim)]" />
                <span className="text-sm font-[family-name:var(--font-mono)] text-[var(--color-text-secondary)]">{biz.socials}</span>
              </div>
              <span className="text-sm font-[family-name:var(--font-mono)] text-[var(--color-text-secondary)]">{biz.reviews}</span>
              <div className="flex justify-end">
                <ExternalLink className="w-4 h-4 text-[var(--color-text-dim)] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile card rows */}
        <div className="md:hidden divide-y divide-[var(--color-border)]/50">
          {sorted.map((biz) => (
            <Link
              key={biz.id}
              href={`/search/${id}/results/${biz.id}`}
              className="block px-4 py-4 hover:bg-[var(--color-bg-secondary)]/30 transition-colors duration-200"
            >
              <div className="flex items-start gap-3 mb-2">
                <ScoreBadge score={biz.score} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate">{biz.name}</p>
                    {contactedBizIds.has(biz.id) && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
                    {savedBizIds.has(biz.id) && !contactedBizIds.has(biz.id) && <Bookmark className="w-3 h-3 text-[var(--color-accent)] shrink-0" />}
                  </div>
                  <p className="text-xs text-[var(--color-text-dim)] truncate">{biz.category}</p>
                </div>
                <TechChip tech={biz.tech} label={biz.techLabel} />
              </div>
              <div className="flex items-center gap-4 ml-[52px] text-xs text-[var(--color-text-secondary)]">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  {biz.rating}
                </span>
                {biz.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-emerald-500" /> Yes</span>}
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-[var(--color-text-dim)]" />
                  {biz.emails}
                </span>
                <span className="flex items-center gap-1">
                  <Share2 className="w-3 h-3 text-[var(--color-text-dim)]" />
                  {biz.socials}
                </span>
                <span className="font-[family-name:var(--font-mono)]">{biz.reviews} reviews</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
