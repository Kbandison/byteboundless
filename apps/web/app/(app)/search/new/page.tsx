"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, MapPin, Globe, SlidersHorizontal } from "lucide-react";
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
const MAX_RESULTS_OPTIONS = [25, 50, 100, 200] as const;

/* ------------------------------------------------------------------
   Search Form (inner component that uses useSearchParams)
   ------------------------------------------------------------------ */
function NewSearchForm() {
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [strictMode, setStrictMode] = useState(false);
  const [maxResults, setMaxResults] = useState<number>(50);
  const [enrich, setEnrich] = useState(true);

  /* Hydrate form from URL search params on mount */
  useEffect(() => {
    const q = searchParams.get("query") ?? searchParams.get("q");
    const loc =
      searchParams.get("location") ?? searchParams.get("loc");
    const strict = searchParams.get("strict");
    const max = searchParams.get("max");
    const enrichParam = searchParams.get("enrich");

    if (q) setQuery(q);
    if (loc) setLocation(loc);
    if (strict === "true" || strict === "1") setStrictMode(true);
    if (max) {
      const parsed = Number(max);
      if (
        (MAX_RESULTS_OPTIONS as readonly number[]).includes(parsed)
      ) {
        setMaxResults(parsed);
      }
    }
    if (enrichParam === "false" || enrichParam === "0")
      setEnrich(false);
  }, [searchParams]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      console.log({
        query,
        location,
        strictMode,
        maxResults,
        enrich,
      });
    },
    [query, location, strictMode, maxResults, enrich]
  );

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-6">
      {/* --- Query --- */}
      <div className="space-y-1.5">
        <label
          htmlFor="query"
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-primary)] font-[family-name:var(--font-display)]"
        >
          <Search className="h-4 w-4 text-[var(--color-text-secondary)]" />
          What kind of business?
        </label>
        <input
          id="query"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="lawn care, dentist, plumber..."
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] transition-colors focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
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
        <input
          id="location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Buford, GA"
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] transition-colors focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
        />
      </div>

      {/* --- Options card --- */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] p-5 space-y-5">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)] font-[family-name:var(--font-mono)]">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Options
        </div>

        {/* Strict mode */}
        <div className="flex items-center justify-between gap-4">
          <label
            htmlFor="strict-mode"
            className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]"
          >
            <Globe className="h-4 w-4 text-[var(--color-text-secondary)]" />
            Only return results with websites
          </label>
          <Toggle
            id="strict-mode"
            checked={strictMode}
            onChange={setStrictMode}
          />
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
            {MAX_RESULTS_OPTIONS.map((opt) => (
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
            </label>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Enrich results with tech stack, performance, and contact data
            </p>
          </div>
          <Toggle id="enrich" checked={enrich} onChange={setEnrich} />
        </div>
      </div>

      {/* --- Submit --- */}
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)] font-[family-name:var(--font-display)]"
      >
        <Search className="h-4 w-4" />
        Start Search
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
export default function NewSearchPage() {
  return (
    <div className="min-h-screen flex flex-col items-center px-6 pt-16 pb-20 bg-[var(--color-bg-primary)]">
      <div className="w-full max-w-xl space-y-2 mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] font-[family-name:var(--font-display)]">
          New Search
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Find businesses that need a better website.
        </p>
      </div>

      <Suspense fallback={<FormSkeleton />}>
        <NewSearchForm />
      </Suspense>
    </div>
  );
}
