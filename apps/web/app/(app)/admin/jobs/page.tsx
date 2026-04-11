import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion-stagger";

export default async function AdminJobsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("scrape_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const jobs = (data ?? []) as Record<string, unknown>[];

  // Get user emails for display
  const userIds = [...new Set(jobs.map((j) => j.user_id as string))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", userIds.length > 0 ? userIds : ["none"]);

  const emailMap = new Map<string, string>();
  ((profiles ?? []) as { id: string; email: string }[]).forEach((p) =>
    emailMap.set(p.id, p.email)
  );

  const statusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-emerald-600 bg-emerald-50";
      case "running": return "text-[var(--color-accent)] bg-blue-50";
      case "failed": return "text-red-600 bg-red-50";
      default: return "text-[var(--color-text-dim)] bg-[var(--color-bg-secondary)]";
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 md:px-8 py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.15em] text-red-500 font-medium font-[family-name:var(--font-mono)] mb-2">
          Admin
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
          Jobs ({jobs.length})
        </h1>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_1fr_90px_90px_100px_100px] gap-3 px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/30 text-[11px] uppercase tracking-wider text-[var(--color-text-dim)] font-medium">
          <span>Query</span>
          <span>User</span>
          <span>Status</span>
          <span>Phase</span>
          <span>Progress</span>
          <span>Created</span>
        </div>

        <StaggerContainer tight className="divide-y divide-[var(--color-border)]/50">
          {jobs.map((job) => (
            <StaggerItem
              row
              key={job.id as string}
              className="grid grid-cols-1 md:grid-cols-[1fr_1fr_90px_90px_100px_100px] gap-3 px-5 py-4 items-center"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {job.query as string} in {job.location as string}
                </p>
                <p className="text-xs text-[var(--color-text-dim)] font-[family-name:var(--font-mono)] truncate md:hidden">
                  {emailMap.get(job.user_id as string) ?? "unknown"}
                </p>
              </div>

              <span className="hidden md:inline text-xs text-[var(--color-text-secondary)] truncate">
                {emailMap.get(job.user_id as string) ?? "unknown"}
              </span>

              <span
                className={cn(
                  "hidden md:inline-flex text-xs px-2 py-0.5 rounded font-medium w-fit",
                  statusColor(job.status as string)
                )}
              >
                {job.status as string}
              </span>

              <span className="hidden md:inline text-xs text-[var(--color-text-secondary)] font-[family-name:var(--font-mono)]">
                {(job.phase as string) ?? "—"}
              </span>

              <span className="hidden md:inline text-xs font-[family-name:var(--font-mono)] text-[var(--color-text-secondary)]">
                {job.progress_current as number}/{job.progress_total as number}
              </span>

              <span className="hidden md:inline text-xs text-[var(--color-text-dim)]">
                {new Date(job.created_at as string).toLocaleString()}
              </span>

              {(job.error as string) && (
                <p className="md:col-span-6 text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg mt-1">
                  {job.error as string}
                </p>
              )}
            </StaggerItem>
          ))}

          {jobs.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-[var(--color-text-secondary)]">
              No jobs yet.
            </div>
          )}
        </StaggerContainer>
      </div>
    </div>
  );
}
