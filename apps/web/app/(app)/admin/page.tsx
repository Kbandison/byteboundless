import Link from "next/link";
import { Users, Activity, Search, Server, MessageSquare } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion-stagger";

export default async function AdminDashboard() {
  await requireAdmin();
  const supabase = await createClient();

  const { count: userCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  const { count: jobCount } = await supabase
    .from("scrape_jobs")
    .select("id", { count: "exact", head: true });

  const { count: runningJobs } = await supabase
    .from("scrape_jobs")
    .select("id", { count: "exact", head: true })
    .eq("status", "running");

  const { count: businessCount } = await supabase
    .from("businesses")
    .select("id", { count: "exact", head: true });

  const { count: openFeedback } = await supabase
    .from("feedback")
    .select("id", { count: "exact", head: true })
    .in("status", ["new", "in_progress"]);

  const stats = [
    { label: "Total Users", value: userCount ?? 0, icon: Users, href: "/admin/users" },
    { label: "Total Jobs", value: jobCount ?? 0, icon: Search, href: "/admin/jobs" },
    { label: "Running Now", value: runningJobs ?? 0, icon: Activity, href: "/admin/jobs" },
    { label: "Open Feedback", value: openFeedback ?? 0, icon: MessageSquare, href: "/admin/feedback" },
    { label: "Businesses Scraped", value: businessCount ?? 0, icon: Server, href: "#" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 md:px-8 py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.15em] text-red-500 font-medium font-[family-name:var(--font-mono)] mb-2">
          Admin Portal
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          System Overview
        </h1>
      </div>

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <StaggerItem key={stat.label}>
              <Link
                href={stat.href}
                className="block bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl p-6 hover:border-[var(--color-border-hover)] transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-secondary)] flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--color-text-secondary)]">{stat.label}</p>
                    <p className="text-2xl font-bold font-[family-name:var(--font-mono)]">{stat.value}</p>
                  </div>
                </div>
              </Link>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Quick links */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StaggerItem>
          <Link
            href="/admin/users"
            className="block p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] hover:border-[var(--color-accent)]/30 transition-all duration-300"
          >
            <Users className="w-6 h-6 text-[var(--color-accent)] mb-3" />
            <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold mb-1">
              Manage Users
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              View all users, change plans, grant admin access, delete accounts.
            </p>
          </Link>
        </StaggerItem>
        <StaggerItem>
          <Link
            href="/admin/jobs"
            className="block p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] hover:border-[var(--color-accent)]/30 transition-all duration-300"
          >
            <Activity className="w-6 h-6 text-[var(--color-accent)] mb-3" />
            <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold mb-1">
              Monitor Jobs
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Track all scrape jobs, see failures, monitor the worker.
            </p>
          </Link>
        </StaggerItem>
        <StaggerItem>
          <Link
            href="/admin/feedback"
            className="block p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] hover:border-[var(--color-accent)]/30 transition-all duration-300"
          >
            <MessageSquare className="w-6 h-6 text-[var(--color-accent)] mb-3" />
            <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold mb-1">
              Feedback Inbox
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Read, triage, and mark status on user-submitted feedback.
            </p>
          </Link>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
