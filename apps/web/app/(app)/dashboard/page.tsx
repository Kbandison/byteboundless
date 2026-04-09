import Link from "next/link";
import { Target, Plus, Search, Users, Flame, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@byteboundless/supabase";

type ScrapeJob = Database["public"]["Tables"]["scrape_jobs"]["Row"];

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch recent searches
  const { data } = await supabase
    .from("scrape_jobs")
    .select("id, query, location, status, options, phase, progress_current, progress_total, created_at, completed_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const recentJobs = (data ?? []) as (Pick<ScrapeJob, "id" | "query" | "location" | "status" | "created_at"> & {
    options: { strict: boolean; maxResults: number; enrich: boolean };
    progress_total: number;
    completed_at: string | null;
  })[];

  const { count: totalSearches } = await supabase
    .from("scrape_jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user!.id);

  // Get lead counts from user's jobs
  const jobIds = recentJobs.map((j) => j.id);
  let totalLeadCount = 0;
  let hotLeadCount = 0;

  if (jobIds.length > 0) {
    const { count: tl } = await supabase
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .in("job_id", jobIds);
    totalLeadCount = tl ?? 0;

    const { count: hl } = await supabase
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .in("job_id", jobIds)
      .gte("lead_score", 80);
    hotLeadCount = hl ?? 0;
  }

  const stats = [
    { label: "Total Searches", value: totalSearches ?? 0, icon: Search },
    { label: "Total Leads", value: totalLeadCount, icon: Users },
    { label: "Hot Leads", value: hotLeadCount, icon: Flame },
  ];

  const hasSearches = recentJobs && recentJobs.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-6 md:px-8 py-10">
      {/* Greeting */}
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
        Welcome back
      </h1>
      <p className="mt-1 text-[var(--color-text-secondary)] text-sm">
        Here&apos;s an overview of your lead generation activity.
      </p>

      {/* Stats Row */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl p-6 flex items-center gap-4"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--color-bg-secondary)]">
                <Icon className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold font-[family-name:var(--font-mono)] text-[var(--color-text-primary)]">
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Searches */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Recent Searches
          </h2>
          {hasSearches && (
            <Link
              href="/search/new"
              className="inline-flex items-center gap-2 text-sm bg-[var(--color-accent)] text-white px-5 py-2.5 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              New Search
            </Link>
          )}
        </div>

        {hasSearches ? (
          <div className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl overflow-hidden divide-y divide-[var(--color-border)]/50">
            {recentJobs.map((job) => (
              <Link
                key={job.id}
                href={
                  job.status === "completed"
                    ? `/search/${job.id}/results`
                    : `/search/${job.id}`
                }
                className="flex items-center justify-between px-6 py-4 hover:bg-[var(--color-bg-secondary)]/30 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium group-hover:text-[var(--color-accent)] transition-colors">
                    {job.query} in {job.location}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        job.status === "completed"
                          ? "text-emerald-600"
                          : job.status === "running"
                            ? "text-[var(--color-accent)]"
                            : job.status === "failed"
                              ? "text-red-500"
                              : "text-[var(--color-text-dim)]"
                      )}
                    >
                      {job.status}
                    </span>
                    {job.status === "completed" && job.progress_total > 0 && (
                      <span className="text-xs text-[var(--color-text-dim)] font-[family-name:var(--font-mono)]">
                        {job.progress_total} results
                      </span>
                    )}
                    <span className="text-xs text-[var(--color-text-dim)]">
                      max {job.options.maxResults}
                    </span>
                    {(() => {
                      const opts = job.options as Record<string, unknown>;
                      const rad = opts.radius as string | undefined;
                      return rad ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-medium capitalize">{rad}</span>
                      ) : null;
                    })()}
                    {job.options.enrich && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">enriched</span>
                    )}
                    <span className="text-xs text-[var(--color-text-dim)]">
                      {new Date(job.created_at).toLocaleDateString()} {new Date(job.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--color-text-dim)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl py-16 px-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-bg-secondary)] mb-6">
              <Target className="w-8 h-8 text-[var(--color-text-dim)]" />
            </div>
            <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-text-primary)]">
              No searches yet
            </h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)] max-w-md">
              Run your first search to discover businesses that need better
              websites.
            </p>
            <Link
              href="/search/new?query=lawn+care&location=Buford,+GA"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
            >
              <Search className="w-4 h-4" />
              Try: lawn care in Buford, GA
            </Link>
            <Link
              href="/search/new"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium bg-[var(--color-accent)] text-white px-6 py-3 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Search
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
