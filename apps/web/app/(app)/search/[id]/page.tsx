"use client";

import { useState, useEffect, useCallback } from "react";
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
  { key: "collecting", label: "Collecting", description: "Finding businesses on Google Maps", icon: MapPin },
  { key: "extracting", label: "Extracting", description: "Pulling details from each listing", icon: FileSearch },
  { key: "enriching", label: "Enriching", description: "Visiting websites, scanning for intel", icon: Globe },
  { key: "scoring", label: "Scoring", description: "Running AI lead scoring", icon: Sparkles },
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
  const [phase, setPhase] = useState<Phase | null>(null);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<JobStatus>("pending");
  const [error, setError] = useState<string | null>(null);
  const [resultCount, setResultCount] = useState(0);

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

  // Initial fetch
  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

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

  const hotCount = Math.round(resultCount * 0.25); // Approximate until we query

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
          <p className="text-sm text-[var(--color-text-secondary)] mt-2">
            {query} in {location}
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
