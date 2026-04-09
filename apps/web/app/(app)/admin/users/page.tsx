import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@byteboundless/supabase";
import { UserActions } from "./actions";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default async function AdminUsersPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const users = (data ?? []) as Profile[];

  return (
    <div className="mx-auto max-w-7xl px-6 md:px-8 py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.15em] text-red-500 font-medium font-[family-name:var(--font-mono)] mb-2">
          Admin
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
          Users ({users.length})
        </h1>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] overflow-hidden">
        {/* Header */}
        <div className="hidden md:grid grid-cols-[1fr_100px_80px_100px_80px_120px] gap-3 px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/30 text-[11px] uppercase tracking-wider text-[var(--color-text-dim)] font-medium">
          <span>Email</span>
          <span>Role</span>
          <span>Plan</span>
          <span>Searches</span>
          <span>Joined</span>
          <span>Actions</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[var(--color-border)]/50">
          {users.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-1 md:grid-cols-[1fr_100px_80px_100px_80px_120px] gap-3 px-5 py-4 items-center"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.email}</p>
                <p className="text-xs text-[var(--color-text-dim)] font-[family-name:var(--font-mono)] md:hidden">
                  {user.role} &middot; {user.plan}
                </p>
              </div>

              <span
                className={`hidden md:inline-flex text-xs px-2 py-0.5 rounded font-medium w-fit ${
                  user.role === "admin"
                    ? "bg-red-500/15 text-red-700"
                    : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]"
                }`}
              >
                {user.role}
              </span>

              <span
                className={`hidden md:inline-flex text-xs px-2 py-0.5 rounded font-medium w-fit ${
                  user.plan === "agency"
                    ? "bg-violet-500/15 text-violet-700"
                    : user.plan === "pro"
                      ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]"
                }`}
              >
                {user.plan}
              </span>

              <span className="hidden md:inline text-sm font-[family-name:var(--font-mono)] text-[var(--color-text-secondary)]">
                {user.searches_used}/{user.searches_limit === 999999 ? "∞" : user.searches_limit}
              </span>

              <span className="hidden md:inline text-xs text-[var(--color-text-dim)]">
                {new Date(user.created_at).toLocaleDateString()}
              </span>

              <UserActions userId={user.id} currentPlan={user.plan} currentRole={user.role} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
