import Link from "next/link";
import { Target, Plus, Search, Users, Flame, ArrowRight, Zap, TrendingUp, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { Sparkline } from "@/components/ui/sparkline";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion-stagger";
import type { Database } from "@byteboundless/supabase";

type ScrapeJob = Database["public"]["Tables"]["scrape_jobs"]["Row"];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch profile
  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("location, full_name, plan, searches_used")
    .eq("id", user!.id)
    .single();
  const profile = profileRaw as { location: string | null; full_name: string | null; plan: string; searches_used: number } | null;
  const userLocation = profile?.location || "Austin, TX";
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  // Fetch recent searches
  const { data } = await supabase
    .from("scrape_jobs")
    .select("id, query, location, status, options, progress_total, created_at, completed_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(6);

  const recentJobs = (data ?? []) as (Pick<ScrapeJob, "id" | "query" | "location" | "status" | "created_at"> & {
    options: Record<string, unknown>;
    progress_total: number;
    completed_at: string | null;
  })[];

  const { count: totalSearches } = await supabase
    .from("scrape_jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user!.id);

  // Get the latest completed job for the "View latest results" link
  const { data: latestCompletedRaw } = await supabase
    .from("scrape_jobs")
    .select("id")
    .eq("user_id", user!.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1);
  const latestCompletedId = ((latestCompletedRaw ?? []) as { id: string }[])[0]?.id;

  // Get all job IDs for count queries
  const { data: allJobIds } = await supabase
    .from("scrape_jobs")
    .select("id")
    .eq("user_id", user!.id);
  const jobIds = ((allJobIds ?? []) as { id: string }[]).map((j) => j.id);
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

  const hasSearches = recentJobs.length > 0;
  const conversionRate = totalLeadCount > 0 ? Math.round((hotLeadCount / totalLeadCount) * 100) : 0;

  // ── Weekly deltas + sparkline data ─────────────────────────────────────
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoIso = weekAgo.toISOString();

  // Searches in the last 7 days (also used for sparkline buckets)
  const { data: weekJobsRaw } = await supabase
    .from("scrape_jobs")
    .select("id, created_at")
    .eq("user_id", user!.id)
    .gte("created_at", weekAgoIso);
  const weekJobs = (weekJobsRaw ?? []) as { id: string; created_at: string }[];
  const searchesThisWeek = weekJobs.length;

  // Build 7-day buckets (oldest → newest) for the searches sparkline
  const dayBuckets: number[] = Array(7).fill(0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const j of weekJobs) {
    const d = new Date(j.created_at);
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - d.getTime()) / 86_400_000);
    if (diffDays >= 0 && diffDays < 7) {
      // index 6 = today, index 0 = 6 days ago
      dayBuckets[6 - diffDays]++;
    }
  }

  // Leads added this week (across all this user's jobs)
  let totalLeadsThisWeek = 0;
  let hotLeadsThisWeek = 0;
  if (jobIds.length > 0) {
    const { count: tlw } = await supabase
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .in("job_id", jobIds)
      .gte("created_at", weekAgoIso);
    totalLeadsThisWeek = tlw ?? 0;

    const { count: hlw } = await supabase
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .in("job_id", jobIds)
      .gte("created_at", weekAgoIso)
      .gte("lead_score", 80);
    hotLeadsThisWeek = hlw ?? 0;
  }

  const PLAYS = [
    { emoji: "🦷", title: "Dentists", query: "dentist", radius: "nearby" },
    { emoji: "🌿", title: "Landscapers", query: "landscaping", radius: "nearby" },
    { emoji: "🔧", title: "Plumbers", query: "plumber", radius: "nearby" },
    { emoji: "🍽️", title: "Restaurants", query: "restaurant", radius: "city" },
    { emoji: "⚖️", title: "Law Firms", query: "law firm", radius: "nearby" },
    { emoji: "🏠", title: "Real Estate", query: "real estate agent", radius: "region" },
    { emoji: "💇", title: "Salons", query: "hair salon", radius: "city" },
    { emoji: "🚗", title: "Auto Repair", query: "auto repair", radius: "nearby" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 md:px-8 py-8 md:py-12">
      {/* Header — oversized display font moment */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-accent)] font-medium font-[family-name:var(--font-mono)] mb-2">
            Dashboard
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-bold tracking-tight">
            Hey, {firstName}
          </h1>
        </div>
        <Link
          href="/search/new"
          className="hidden md:inline-flex items-center gap-2 bg-[var(--color-accent)] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-all duration-300"
        >
          <Plus className="w-4 h-4" />
          New Search
        </Link>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {/* Big stat — hot leads (spans 2 cols, 2 rows) — premium card with shadow */}
        <div className="col-span-2 row-span-2 p-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] flex flex-col justify-between shadow-[0_4px_24px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_-12px_rgba(0,0,0,0.4)]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-emerald-500" />
                <span className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium">Hot Leads</span>
              </div>
              {hotLeadsThisWeek > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                  <ArrowUpRight className="w-3 h-3" />
                  +{hotLeadsThisWeek} this week
                </span>
              )}
            </div>
            <p className="font-[family-name:var(--font-mono)] text-7xl md:text-8xl font-bold tracking-tight text-emerald-500">
              {hotLeadCount}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2">
              Score 80+ — ready to pitch
            </p>
          </div>
          {hotLeadCount > 0 && latestCompletedId && (
            <Link
              href={`/search/${latestCompletedId}/results`}
              className="inline-flex items-center gap-2 text-sm text-[var(--color-accent)] font-medium hover:underline mt-4"
            >
              View latest results <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Total searches with sparkline */}
        <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] relative overflow-hidden">
          <Search className="w-4 h-4 text-[var(--color-text-dim)] mb-3" />
          <div className="flex items-end justify-between gap-2">
            <p className="font-[family-name:var(--font-mono)] text-3xl font-bold">{totalSearches ?? 0}</p>
            <Sparkline data={dayBuckets} className="opacity-70" />
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-[var(--color-text-dim)]">Searches</p>
            {searchesThisWeek > 0 && (
              <span className="text-[10px] font-medium text-emerald-600">+{searchesThisWeek} 7d</span>
            )}
          </div>
        </div>

        {/* Total leads */}
        <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
          <Users className="w-4 h-4 text-[var(--color-text-dim)] mb-3" />
          <p className="font-[family-name:var(--font-mono)] text-3xl font-bold">{totalLeadCount}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-[var(--color-text-dim)]">Total Leads</p>
            {totalLeadsThisWeek > 0 && (
              <span className="text-[10px] font-medium text-emerald-600">+{totalLeadsThisWeek} 7d</span>
            )}
          </div>
        </div>

        {/* Conversion rate */}
        <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
          <TrendingUp className="w-4 h-4 text-[var(--color-text-dim)] mb-3" />
          <p className="font-[family-name:var(--font-mono)] text-3xl font-bold">{conversionRate}%</p>
          <p className="text-xs text-[var(--color-text-dim)] mt-1">Hot Rate</p>
        </div>

        {/* Plan */}
        <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
          <Zap className="w-4 h-4 text-[var(--color-text-dim)] mb-3" />
          <p className="font-[family-name:var(--font-display)] text-lg font-bold capitalize">{profile?.plan ?? "free"}</p>
          <p className="text-xs text-[var(--color-text-dim)] mt-1">Current Plan</p>
        </div>
      </div>

      {/* Quick Plays — compact row */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
            Quick Plays
          </h2>
          <span className="text-xs text-[var(--color-text-dim)] hidden sm:block">One-click searches for your area</span>
        </div>
        <StaggerContainer className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {PLAYS.map((play) => (
            <StaggerItem key={play.query} className="shrink-0">
              <Link
                href={`/search/new?query=${encodeURIComponent(play.query)}&location=${encodeURIComponent(userLocation)}&radius=${play.radius}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] hover:border-[var(--color-accent)]/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]"
              >
                <span>{play.emoji}</span>
                {play.title}
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {/* Recent Searches */}
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight mb-4">
          Recent Activity
        </h2>

        {hasSearches ? (
          <StaggerContainer className="space-y-2">
            {recentJobs.map((job) => (
              <StaggerItem key={job.id}>
              <Link
                href={job.status === "completed" ? `/search/${job.id}/results` : `/search/${job.id}`}
                className="flex items-center justify-between px-5 py-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] hover:border-[var(--color-accent)]/20 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      job.status === "completed" ? "bg-emerald-500" :
                      job.status === "running" ? "bg-[var(--color-accent)] animate-pulse" :
                      job.status === "failed" ? "bg-red-500" : "bg-[var(--color-text-dim)]"
                    )} />
                    <p className="text-sm font-medium group-hover:text-[var(--color-accent)] transition-colors truncate">
                      {job.query} in {job.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-1 ml-5">
                    {job.status === "completed" && job.progress_total > 0 && (
                      <span className="text-xs font-[family-name:var(--font-mono)] text-[var(--color-text-dim)]">
                        {job.progress_total} results
                      </span>
                    )}
                    {(() => {
                      const rad = (job.options as Record<string, unknown>).radius as string | undefined;
                      return rad ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-dim)] font-medium capitalize">{rad}</span> : null;
                    })()}
                    <span className="text-xs text-[var(--color-text-dim)]">
                      {new Date(job.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--color-text-dim)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          /* Empty State — personality per APP.md */
          <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] p-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-4)] to-transparent pointer-events-none" />
            <div className="relative">
              <Target className="w-12 h-12 text-[var(--color-text-dim)] mx-auto mb-6" />
              <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold mb-2">
                Your pipeline starts here
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto mb-8">
                Run your first search to discover businesses that need better websites. We&apos;ll score them, find their contact info, and write your pitch.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={`/search/new?query=lawn+care&location=${encodeURIComponent(userLocation)}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent)] hover:underline"
                >
                  <Search className="w-4 h-4" />
                  Try: lawn care in {userLocation}
                </Link>
                <Link
                  href="/search/new"
                  className="inline-flex items-center gap-2 bg-[var(--color-accent)] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  New Search
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      <Link
        href="/search/new"
        className="md:hidden fixed bottom-6 right-6 z-30 w-14 h-14 bg-[var(--color-accent)] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[var(--color-accent-hover)] transition-all"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}
