"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { use } from "react";
import {
  MapPin,
  FileSearch,
  Globe,
  Sparkles,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowRight,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Phase = "collecting" | "extracting" | "enriching" | "scoring" | "done";
type JobStatus = "pending" | "running" | "completed" | "failed";

interface PhaseConfig {
  key: Phase;
  label: string;
  description: string;
  icon: typeof MapPin;
}

const PHASES: PhaseConfig[] = [
  { key: "collecting", label: "Collecting Listings", description: "Scrolling through Google Maps to find businesses in your area", icon: MapPin },
  { key: "extracting", label: "Extracting Details", description: "Visiting each Google Maps listing to pull name, phone, address, rating, and website", icon: FileSearch },
  { key: "enriching", label: "Enriching Websites", description: "Scanning each business's website for tech stack, emails, social profiles, and mobile-friendliness", icon: Globe },
  { key: "scoring", label: "Scoring Leads", description: "Analyzing 12+ signals to rank each business by rebuild opportunity", icon: Sparkles },
];

function PhaseIndicator({
  config,
  status,
  current,
  total,
}: {
  config: PhaseConfig;
  status: "pending" | "active" | "completed";
  current: number;
  total: number;
}) {
  const Icon = config.icon;
  return (
    <div
      className={cn(
        "relative flex items-start gap-4 p-5 rounded-xl border transition-all duration-500",
        status === "active"
          ? "border-[var(--color-accent)]/30 bg-[var(--color-accent-4)]"
          : status === "completed"
            ? "border-emerald-500/20 bg-emerald-50"
            : "border-[var(--color-border)] bg-[var(--color-bg-tertiary)] opacity-50"
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-500",
          status === "active"
            ? "bg-[var(--color-accent-10)]"
            : status === "completed"
              ? "bg-emerald-100"
              : "bg-[var(--color-bg-secondary)]"
        )}
      >
        {status === "completed" ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        ) : status === "active" ? (
          <Loader2 className="w-5 h-5 text-[var(--color-accent)] animate-spin" />
        ) : (
          <Icon className="w-5 h-5 text-[var(--color-text-dim)]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3
            className={cn(
              "text-sm font-semibold font-[family-name:var(--font-display)]",
              status === "active" ? "text-[var(--color-text-primary)]"
                : status === "completed" ? "text-emerald-700"
                  : "text-[var(--color-text-dim)]"
            )}
          >
            {config.label}
          </h3>
          {(status === "active" || status === "completed") && total > 0 && (
            <span className="text-xs font-[family-name:var(--font-mono)] text-[var(--color-text-secondary)]">
              {current} / {total}
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--color-text-secondary)]">{config.description}</p>
        {status === "active" && total > 0 && (
          <div className="mt-3 h-1 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-700 ease-out"
              style={{ width: `${Math.round((current / total) * 100)}%` }}
            />
          </div>
        )}
        {status === "active" && total === 0 && (
          <div className="mt-3 h-1 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
            <div className="h-full w-1/3 rounded-full bg-[var(--color-accent)] animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchRunningPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState("nearby");
  const [phase, setPhase] = useState<Phase | null>(null);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<JobStatus>("pending");
  const [error, setError] = useState<string | null>(null);
  const [resultCount, setResultCount] = useState(0);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Use a ref for startedAt inside the fetch so we don't need to list it
  // as a dep on useCallback (which would cause the callback to change on
  // every fetch and retrigger the effect).
  const startedAtRef = useRef<Date | null>(null);

  const fetchJob = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("scrape_jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (!data) return;
    const job = data as Record<string, unknown>;
    setQuery(job.query as string);
    setLocation(job.location as string);
    const opts = job.options as Record<string, unknown> | null;
    if (opts?.radius) setRadius(opts.radius as string);
    if (!startedAtRef.current && job.created_at) {
      const d = new Date(job.created_at as string);
      startedAtRef.current = d;
      setStartedAt(d);
    }
    setStatus(job.status as JobStatus);
    setPhase((job.phase as Phase) ?? null);
    setCurrent(job.progress_current as number);
    setTotal(job.progress_total as number);
    setError(job.error as string | null);

    if (job.status === "completed") {
      const { count } = await supabase
        .from("businesses")
        .select("id", { count: "exact", head: true })
        .eq("job_id", id);
      setResultCount(count ?? 0);
    }
  }, [id]);

  // Initial fetch. setState calls happen inside the async IIFE (after an
  // await), so they're in a later microtask — not "synchronously within an
  // effect." The lint rule doesn't see through the function call, so we
  // disable it here for this known-good pattern.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchJob();
  }, [fetchJob]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Elapsed time counter
  useEffect(() => {
    if (status === "completed" || status === "failed" || !startedAt) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [status, startedAt]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`job-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "scrape_jobs", filter: `id=eq.${id}` },
        (payload) => {
          const job = payload.new as Record<string, unknown>;
          setStatus(job.status as JobStatus);
          setPhase((job.phase as Phase) ?? null);
          setCurrent(job.progress_current as number);
          setTotal(job.progress_total as number);
          setError(job.error as string | null);

          if (job.status === "completed") {
            fetchJob(); // Re-fetch to get result count
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, fetchJob]);

  // Also poll every 3s as fallback (Realtime can be unreliable)
  useEffect(() => {
    if (status === "completed" || status === "failed") return;
    const interval = setInterval(fetchJob, 3000);
    return () => clearInterval(interval);
  }, [status, fetchJob]);

  const getPhaseStatus = (phaseKey: Phase): "pending" | "active" | "completed" => {
    const phaseOrder: Phase[] = ["collecting", "extracting", "enriching", "scoring"];
    const currentIdx = phase ? phaseOrder.indexOf(phase) : -1;
    const thisIdx = phaseOrder.indexOf(phaseKey);
    if (phase === "done" || status === "completed") return "completed";
    if (thisIdx < currentIdx) return "completed";
    if (thisIdx === currentIdx) return "active";
    return "pending";
  };

  return (
    <div className="max-w-2xl mx-auto px-6 md:px-8 py-12">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-accent)] font-medium font-[family-name:var(--font-mono)] mb-2">
          Search #{id.slice(0, 8)}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold tracking-tight">
          {status === "completed" ? "Search complete" : status === "failed" ? "Search failed" : "Searching..."}
        </h1>
        {query && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-[var(--color-text-secondary)]">
            <span>{query} in {location}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-bg-secondary)] font-medium capitalize">{radius}</span>
            {elapsed > 0 && status !== "completed" && status !== "failed" && (
              <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-text-dim)]">
                {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")} elapsed
              </span>
            )}
          </div>
        )}
        {/* Live phase detail */}
        {status === "running" && phase && current > 0 && total > 0 && (
          <p className="text-xs text-[var(--color-accent)] font-[family-name:var(--font-mono)] mt-3">
            {phase === "collecting" && `Found ${current} listings so far...`}
            {phase === "extracting" && `Extracting details: ${current} of ${total} listings visited`}
            {phase === "enriching" && `Enriching websites: ${current} of ${total} sites scanned for tech stack, emails, and socials`}
            {phase === "scoring" && `Scoring leads: ${current} of ${total} analyzed`}
          </p>
        )}
      </div>

      <div className="space-y-3 mb-10">
        {PHASES.map((config) => (
          <PhaseIndicator
            key={config.key}
            config={config}
            status={getPhaseStatus(config.key)}
            current={config.key === phase ? current : getPhaseStatus(config.key) === "completed" ? total : 0}
            total={config.key === phase ? total : getPhaseStatus(config.key) === "completed" ? total : 0}
          />
        ))}
      </div>

      {/* "Take your time" banner — only visible while the job is still running.
          Lighthouse audits on ~30 sites can push a full search to 15-20 min,
          so we want to make it clear the user doesn't need to stare at this
          page the whole time. */}
      {status !== "completed" && status !== "failed" && (
        <div className="mb-10 p-5 rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5">
          <div className="flex items-start gap-3">
            <Mail className="w-4 h-4 text-[var(--color-accent)] mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                You can close this tab
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                Full searches with Lighthouse audits can take 10&ndash;20 minutes.
                We&apos;ll email you a link to your results as soon as it&apos;s done.
                Check your spam or promotions folder if you don&apos;t see it.
              </p>
              <p className="text-[11px] text-[var(--color-text-dim)] mt-2">
                Prefer to stay on the page? That works too &mdash; progress updates live.
                You can toggle email notifications off in{" "}
                <Link
                  href="/settings#notifications"
                  className="text-[var(--color-accent)] hover:underline"
                >
                  Settings
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      )}

      {status === "completed" && (
        <div className="text-center p-8 rounded-xl border border-emerald-500/20 bg-emerald-50">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-4" />
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold mb-2">
            {resultCount} leads found
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            Your results are ready. See who needs a better website.
          </p>
          <Link
            href={`/search/${id}/results`}
            className="group inline-flex items-center gap-2 bg-[var(--color-accent)] text-white px-7 py-3 rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-all duration-300"
          >
            View Results
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>
      )}

      {status === "failed" && (
        <div className="text-center p-8 rounded-xl border border-red-500/20 bg-red-50">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold mb-2">
            Something went wrong
          </h2>
          {error && (
            <p className="text-sm text-red-600 mb-4 font-[family-name:var(--font-mono)]">{error}</p>
          )}
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            The search encountered an error. Please try again.
          </p>
          <Link
            href="/search/new"
            className="inline-flex items-center gap-2 border border-[var(--color-border)] px-6 py-3 rounded-lg text-sm font-medium hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all duration-300"
          >
            Try Again
          </Link>
        </div>
      )}

      {status === "pending" && (
        <div className="text-center p-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
          <Loader2 className="w-8 h-8 text-[var(--color-text-dim)] mx-auto mb-4 animate-spin" />
          <p className="text-sm text-[var(--color-text-secondary)]">
            Waiting for worker to pick up this job...
          </p>
        </div>
      )}
    </div>
  );
}
