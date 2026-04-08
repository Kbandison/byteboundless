import Link from "next/link";
import { Target, Plus, Search, Users, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const STATS = [
  { label: "Total Searches", value: 0, icon: Search },
  { label: "Total Leads", value: 0, icon: Users },
  { label: "Hot Leads", value: 0, icon: Flame },
] as const;

export default function DashboardPage() {
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
        {STATS.map((stat) => {
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
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Recent Searches
        </h2>

        {/* Empty State */}
        <div className="mt-6 flex flex-col items-center justify-center bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl py-16 px-6 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-bg-secondary)] mb-6">
            <Target className="w-8 h-8 text-[var(--color-text-dim)]" />
          </div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-text-primary)]">
            No searches yet
          </h3>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)] max-w-md">
            Run your first search to discover businesses that need better
            websites. We&apos;ll score each lead and surface the best
            opportunities.
          </p>

          {/* Sample CTA */}
          <Link
            href="/search/new?query=lawn+care&location=Buford,+GA"
            className={cn(
              "mt-6 inline-flex items-center gap-2 text-sm font-medium",
              "text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors duration-200"
            )}
          >
            <Search className="w-4 h-4" />
            Try: lawn care in Buford, GA
          </Link>

          {/* New Search Button */}
          <Link
            href="/search/new"
            className={cn(
              "mt-6 inline-flex items-center gap-2 text-sm font-medium",
              "bg-[var(--color-accent)] text-white px-6 py-3 rounded-lg",
              "hover:bg-[var(--color-accent-hover)] transition-colors duration-200"
            )}
          >
            <Plus className="w-4 h-4" />
            New Search
          </Link>
        </div>
      </div>
    </div>
  );
}
