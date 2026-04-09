"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UserActions({
  userId,
  currentPlan,
  currentRole,
}: {
  userId: string;
  currentPlan: string;
  currentRole: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateUser(updates: Record<string, unknown>) {
    setLoading(true);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...updates }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentPlan}
        disabled={loading}
        onChange={(e) => {
          const plan = e.target.value;
          const limit = plan === "free" ? 3 : 999999;
          updateUser({ plan, searches_limit: limit });
        }}
        className="text-xs px-2 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] disabled:opacity-50"
      >
        <option value="free">Free</option>
        <option value="pro">Pro</option>
        <option value="agency">Agency</option>
      </select>

      <button
        disabled={loading}
        onClick={() =>
          updateUser({ role: currentRole === "admin" ? "user" : "admin" })
        }
        className={`text-[10px] px-2 py-1.5 rounded-md border font-medium transition-colors disabled:opacity-50 ${
          currentRole === "admin"
            ? "border-red-200 text-red-600 hover:bg-red-50"
            : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        }`}
      >
        {currentRole === "admin" ? "Remove Admin" : "Make Admin"}
      </button>
    </div>
  );
}
