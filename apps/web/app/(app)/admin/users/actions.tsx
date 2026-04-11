"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles, Trash2, X } from "lucide-react";

interface UserActionsProps {
  userId: string;
  currentEmail: string;
  currentPlan: string;
  currentRole: string;
  planExpiresAt: string | null;
  isRootAdmin: boolean;
  isSelf: boolean;
}

export function UserActions({
  userId,
  currentEmail,
  currentPlan,
  currentRole,
  planExpiresAt,
  isRootAdmin,
  isSelf,
}: UserActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-reset the delete confirmation after 5s so a stray click
  // doesn't leave the row armed indefinitely.
  useEffect(() => {
    if (!confirmingDelete) return;
    confirmTimerRef.current = setTimeout(() => {
      setConfirmingDelete(false);
    }, 5000);
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, [confirmingDelete]);

  const onBeta = planExpiresAt !== null && new Date(planExpiresAt) > new Date();

  async function updateUser(updates: Record<string, unknown>, label: string) {
    setLoading(label);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...updates }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Update failed");
    } else {
      toast.success("Updated");
    }
    setLoading(null);
    router.refresh();
  }

  async function handleDelete() {
    setLoading("delete");
    try {
      const res = await fetch(
        `/api/admin/users?userId=${encodeURIComponent(userId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Delete failed");
      } else {
        toast.success(`Deleted ${currentEmail}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setLoading(null);
      setConfirmingDelete(false);
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={currentPlan}
        disabled={loading !== null}
        onChange={(e) => {
          const plan = e.target.value;
          const limit = plan === "free" ? 3 : 999999;
          updateUser({ plan, searches_limit: limit }, "plan");
        }}
        className="text-xs px-2 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] disabled:opacity-50"
      >
        <option value="free">Free</option>
        <option value="pro">Pro</option>
        <option value="agency">Agency</option>
      </select>

      {onBeta ? (
        <button
          disabled={loading !== null}
          onClick={() => updateUser({ action: "revoke_beta" }, "revoke_beta")}
          className="inline-flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-md border border-amber-500/30 text-amber-700 hover:bg-amber-500/10 font-medium transition-colors disabled:opacity-50"
          title="Revoke beta access"
        >
          {loading === "revoke_beta" ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
          Revoke
        </button>
      ) : (
        <button
          disabled={loading !== null}
          onClick={() => updateUser({ action: "grant_beta", days: 30 }, "grant_beta")}
          className="inline-flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-md border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] font-medium transition-colors disabled:opacity-50"
          title="Grant 30-day beta access (agency tier)"
        >
          {loading === "grant_beta" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Grant Beta 30d
        </button>
      )}

      {/* Role toggle — hidden for the root admin so their role can't
          be changed from the UI. Kept for every other admin so the
          root can demote helpers they previously promoted. */}
      {!isRootAdmin && (
        <button
          disabled={loading !== null}
          onClick={() =>
            updateUser({ role: currentRole === "admin" ? "user" : "admin" }, "role")
          }
          className={`text-[10px] px-2 py-1.5 rounded-md border font-medium transition-colors disabled:opacity-50 ${
            currentRole === "admin"
              ? "border-red-200 text-red-600 hover:bg-red-50"
              : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          }`}
        >
          {loading === "role" ? (
            <Loader2 className="w-3 h-3 animate-spin inline" />
          ) : currentRole === "admin" ? (
            "Remove Admin"
          ) : (
            "Make Admin"
          )}
        </button>
      )}

      {/* Delete — hidden for the root admin AND for the caller's own
          row. Two-click confirm: first click arms, second click
          within 5s fires. The 5s timeout resets via useEffect. */}
      {!isRootAdmin && !isSelf && (
        <button
          disabled={loading !== null}
          onClick={() => {
            if (confirmingDelete) {
              handleDelete();
            } else {
              setConfirmingDelete(true);
            }
          }}
          className={`inline-flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-md border font-medium transition-colors disabled:opacity-50 ${
            confirmingDelete
              ? "border-red-500 bg-red-500 text-white hover:bg-red-600"
              : "border-red-200 text-red-600 hover:bg-red-50"
          }`}
          title={
            confirmingDelete
              ? "Click again to permanently delete"
              : `Delete ${currentEmail}`
          }
        >
          {loading === "delete" ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Trash2 className="w-3 h-3" />
          )}
          {confirmingDelete ? "Click to confirm" : "Delete"}
        </button>
      )}
    </div>
  );
}
