"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, MapPin, Globe, SlidersHorizontal, Loader2, Lock } from "lucide-react";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { HelpTip } from "@/components/ui/help-tip";
import { usePlan, isPaidPlan } from "@/hooks/use-plan";
import { BUSINESS_CATEGORIES } from "@/lib/autocomplete-data";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------
   Inline Toggle
   A simple button with a sliding dot indicator.
   ------------------------------------------------------------------ */
function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-lg border border-[var(--color-border)] transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]",
        checked
          ? "bg-[var(--color-accent)] border-[var(--color-accent)]"
          : "bg-[var(--color-bg-secondary)]"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 rounded-md bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-[22px]" : "translate-x-[3px]"
        )}
      />
    </button>
  );
}

/* ------------------------------------------------------------------
   Max Results Options
   ------------------------------------------------------------------ */
const PLAN_LIMITS: Record<string, { options: number[]; max: number }> = {
  free: { options: [25, 50], max: 50 },
  pro: { options: [25, 50, 100, 200, 500], max: 500 },
  agency: { options: [25, 50, 100, 200, 500, 1000], max: 1000 },
};

/* ------------------------------------------------------------------
   Search Form (inner component that uses useSearchParams)
   ------------------------------------------------------------------ */
function NewSearchForm() {
  const searchParams = useSearchParams();

  const userPlan = usePlan();
  const paid = isPaidPlan(userPlan);
  const [mode, setMode] = useState<"search" | "urls">("search");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState<string>("city");
  const [pastedUrls, setPastedUrls] = useState("");
  const [plan, setPlan] = useState<string>("free");
  const [maxResults, setMaxResults] = useState<number>(50);
  const [enrich, setEnrich] = useState(true);

  // Fetch user plan to determine max results options
  useEffect(() => {
    async function fetchPlan() {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
      if (data) {
        const p = (data as { plan: string }).plan;
        setPlan(p);
        // Set default max to the plan's highest option
        const limits = PLAN_LIMITS[p] || PLAN_LIMITS.free;
        setMaxResults(Math.min(maxResults, limits.max));
      }
    }
    fetchPlan();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Hydrate form from URL search params on mount */
  useEffect(() => {
    const q = searchParams.get("query") ?? searchParams.get("q");
    const loc =
      searchParams.get("location") ?? searchParams.get("loc");
    const rad = searchParams.get("radius");
    const max = searchParams.get("max");
    const enrichParam = searchParams.get("enrich");

    if (q) setQuery(q);
    if (loc) setLocation(loc);
    if (rad && ["city", "nearby", "region", "statewide"].includes(rad)) setRadius(rad);
    if (max) {
      const parsed = Number(max);
      if (
        (PLAN_LIMITS[plan]?.options ?? PLAN_LIMITS.free.options).includes(parsed)
      ) {
        setMaxResults(parsed);
      }
    }
    if (enrichParam === "false" || enrichParam === "0")
      setEnrich(false);
  }, [searchParams]);

  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (mode === "search" && (!query || !location)) return;
      if (mode === "urls" && !pastedUrls.trim()) return;

      setSubmitting(true);
      setError(null);

      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "search"
              ? { query, location, options: { radius, maxResults, enrich } }
              : { query: "URL Import", location: "Custom", options: { radius: "city", maxResults: 500, enrich, mode: "urls", urls: pastedUrls.split("\n").map((u) => u.trim()).filter(Boolean) } }
          ),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to create search");
          setSubmitting(false);
          return;
        }

        router.push(`/search/${data.job.id}`);
      } catch {
        setError("Network error. Please try again.");
        setSubmitting(false);
      }
    },
    [mode, query, location, radius, maxResults, enrich, pastedUrls, router]
  );

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-6">
      {/* --- Mode Toggle --- */}
      <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden">
        <button
          type="button"
          onClick={() => setMode("search")}
          className={cn(
            "flex-1 text-sm font-medium py-2.5 transition-colors",
            mode === "search"
              ? "bg-[var(--color-accent)] text-white"
              : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
          )}
        >
          Google Maps Search
        </button>
        <button
          type="button"
          onClick={() => { if (paid) setMode("urls"); }}
          className={cn(
            "flex-1 text-sm font-medium py-2.5 transition-colors flex items-center justify-center gap-1.5",
            !paid
              ? "bg-[var(--color-bg-tertiary)] text-[var(--color-text-dim)] cursor-not-allowed"
              : mode === "urls"
                ? "bg-[var(--color-accent)] text-white"
                : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
          )}
        >
          {!paid && <Lock className="w-3 h-3" />}
          Paste URLs to Qualify
        </button>
      </div>

      {mode === "urls" ? (
        /* --- URL Paste Mode --- */
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-primary)] font-[family-name:var(--font-display)]">
              <Globe className="h-4 w-4 text-[var(--color-text-secondary)]" />
              Business Website URLs
              <HelpTip text="Paste one URL per line. We'll visit each website, detect their tech stack, find emails, run Lighthouse audits, and score them — skipping the Google Maps scrape entirely." />
            </label>
            <textarea
              value={pastedUrls}
              onChange={(e) => setPastedUrls(e.target.value)}
              placeholder={"https://example-dental.com\nhttps://joes-plumbing.com\nhttps://greenthumb-landscaping.net"}
              rows={8}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-4 py-3 text-sm font-[family-name:var(--font-mono)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent resize-y"
            />
            <p className="text-xs text-[var(--color-text-dim)]">
              {pastedUrls.split("\n").filter((u) => u.trim()).length} URLs entered
            </p>
          </div>
        </div>
      ) : (
        <>
      {/* --- Query --- */}
      <div className="space-y-1.5">
        <label
          htmlFor="query"
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-primary)] font-[family-name:var(--font-display)]"
        >
          <Search className="h-4 w-4 text-[var(--color-text-secondary)]" />
          What kind of business?
        </label>
        <AutocompleteInput
          id="query"
          value={query}
          onChange={setQuery}
          suggestions={BUSINESS_CATEGORIES}
          placeholder="lawn care, dentist, plumber..."
          icon={<Search className="h-4 w-4" />}
        />
      </div>

      {/* --- Location --- */}
      <div className="space-y-1.5">
        <label
          htmlFor="location"
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-primary)] font-[family-name:var(--font-display)]"
        >
          <MapPin className="h-4 w-4 text-[var(--color-text-secondary)]" />
          Where?
        </label>
        <AutocompleteInput
          id="location"
          value={location}
          onChange={setLocation}
          apiEndpoint="/api/cities"
          placeholder="Austin, TX"
          icon={<MapPin className="h-4 w-4" />}
        />
      </div>

      {/* --- Options card --- */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] p-5 space-y-5">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)] font-[family-name:var(--font-mono)]">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Options
        </div>

        {/* Search radius */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm text-[var(--color-text-primary)]">
              Search Area
            </label>
            <HelpTip text="City: exact city results only. Nearby: includes surrounding ~25mi. Region: wider ~50mi metro area. Statewide: entire state. Larger areas take longer to scrape." />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { value: "city", label: "City Only", time: "~2 min" },
              { value: "nearby", label: "Nearby", time: "~3 min" },
              { value: "region", label: "Region", time: "~5 min" },
              { value: "statewide", label: "Statewide", time: "~8 min" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRadius(opt.value)}
                className={cn(
                  "flex flex-col items-center py-2.5 px-3 rounded-lg border text-xs font-medium transition-all duration-200",
                  radius === opt.value
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                    : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]"
                )}
              >
                <span>{opt.label}</span>
                <span className={cn("text-[10px] mt-0.5", radius === opt.value ? "text-[var(--color-accent)]/70" : "text-[var(--color-text-dim)]")}>{opt.time}</span>
              </button>
            ))}
          </div>
          {(radius === "region" || radius === "statewide") && (
            <p className="text-[11px] text-amber-600 mt-2">
              {radius === "statewide"
                ? "Statewide searches collect more listings and take significantly longer. Consider using 100-200 max results."
                : "Region searches include a wider metro area and may take a few extra minutes."}
            </p>
          )}
        </div>

        {/* Max results */}
        <div className="flex items-center justify-between gap-4">
          <label
            htmlFor="max-results"
            className="text-sm text-[var(--color-text-primary)]"
          >
            Max results
          </label>
          <select
            id="max-results"
            value={maxResults}
            onChange={(e) => setMaxResults(Number(e.target.value))}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-3 py-1.5 text-sm text-[var(--color-text-primary)] transition-colors focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none cursor-pointer"
          >
            {(PLAN_LIMITS[plan]?.options ?? PLAN_LIMITS.free.options).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Enrich */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <label
              htmlFor="enrich"
              className="text-sm text-[var(--color-text-primary)]"
            >
              Visit websites and collect intel
              <HelpTip text="When enabled, we visit each business's website to detect their tech stack, find emails, check social profiles, and assess mobile-friendliness. This powers the lead score and AI pitches." side="right" />
            </label>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Enrich results with tech stack, performance, and contact data
            </p>
          </div>
          <Toggle id="enrich" checked={enrich} onChange={setEnrich} />
        </div>
      </div>
        </>
      )}

      {/* --- Error --- */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* --- Submit --- */}
      <button
        type="submit"
        disabled={submitting || (mode === "search" ? !query || !location : !pastedUrls.trim())}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)] font-[family-name:var(--font-display)]"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Search className="h-4 w-4" />
            Start Search
          </>
        )}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------
   Fallback skeleton shown while Suspense resolves
   ------------------------------------------------------------------ */
function FormSkeleton() {
  return (
    <div className="w-full max-w-xl space-y-6 animate-pulse">
      {/* Query skeleton */}
      <div className="space-y-1.5">
        <div className="h-4 w-40 rounded bg-[var(--color-border)]" />
        <div className="h-11 w-full rounded-lg bg-[var(--color-border)]" />
      </div>
      {/* Location skeleton */}
      <div className="space-y-1.5">
        <div className="h-4 w-20 rounded bg-[var(--color-border)]" />
        <div className="h-11 w-full rounded-lg bg-[var(--color-border)]" />
      </div>
      {/* Options card skeleton */}
      <div className="h-48 w-full rounded-lg bg-[var(--color-border)]" />
      {/* Button skeleton */}
      <div className="h-12 w-full rounded-lg bg-[var(--color-border)]" />
    </div>
  );
}

/* ------------------------------------------------------------------
   Page export (wraps form in Suspense for useSearchParams)
   ------------------------------------------------------------------ */
const QUICK_PLAYS = [
  { emoji: "🦷", label: "Dentists", query: "dentist" },
  { emoji: "🌿", label: "Landscapers", query: "landscaping" },
  { emoji: "🔧", label: "Plumbers", query: "plumber" },
  { emoji: "🍽️", label: "Restaurants", query: "restaurant" },
  { emoji: "⚖️", label: "Law Firms", query: "law firm" },
  { emoji: "🏠", label: "Real Estate", query: "real estate agent" },
  { emoji: "💇", label: "Salons", query: "hair salon" },
  { emoji: "🚗", label: "Auto Repair", query: "auto repair" },
  { emoji: "🐾", label: "Pet Groomers", query: "pet grooming" },
  { emoji: "🏋️", label: "Gyms", query: "gym" },
];

export default function NewSearchPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 md:px-8 py-8 md:py-12">
      {/* Header — matching dashboard design language */}
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-accent)] font-medium font-[family-name:var(--font-mono)] mb-2">
          New Search
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-bold tracking-tight">
          Find your next client
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-2">
          Search Google Maps or paste URLs to discover businesses that need better websites.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
        {/* Left: Form */}
        <div>
          <Suspense fallback={<FormSkeleton />}>
            <NewSearchForm />
          </Suspense>
        </div>

        {/* Right: Quick Plays sidebar */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-3">Quick picks</p>
          <div className="flex flex-wrap lg:flex-col gap-2">
            {QUICK_PLAYS.map((play) => (
              <a
                key={play.query}
                href={`?query=${encodeURIComponent(play.query)}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-sm font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/30 hover:text-[var(--color-accent)] transition-all duration-200"
              >
                <span>{play.emoji}</span>
                {play.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
