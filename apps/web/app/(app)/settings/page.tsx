"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, CreditCard, Key, AlertTriangle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("free");
  const [searchesUsed, setSearchesUsed] = useState(0);
  const [searchesLimit, setSearchesLimit] = useState(3);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        const p = data as Record<string, unknown>;
        setPlan(p.plan as string);
        setSearchesUsed(p.searches_used as number);
        setSearchesLimit(p.searches_limit as number);
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Delete profile (cascades to jobs, businesses, lists, etc.)
    await supabase.from("profiles").delete().eq("id", user.id);
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-8 py-20 flex flex-col items-center">
        <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-8 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight mb-8">
        Settings
      </h1>

      <div className="space-y-8">
        {/* Account */}
        <section className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-[var(--color-text-dim)]" />
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              Account
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium block mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm text-[var(--color-text-secondary)]"
              />
              <p className="text-xs text-[var(--color-text-dim)] mt-1.5">
                Email changes are managed through magic link authentication.
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-sm text-[var(--color-text-secondary)] border border-[var(--color-border)] px-4 py-2 rounded-lg hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Sign Out
            </button>
          </div>
        </section>

        {/* Billing */}
        <section className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="w-5 h-5 text-[var(--color-text-dim)]" />
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              Billing
            </h2>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--color-bg-secondary)]">
            <div>
              <p className="text-sm font-medium capitalize">{plan} Plan</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                {searchesLimit === 999999
                  ? "Unlimited searches"
                  : `${searchesLimit - searchesUsed} searches remaining`}
              </p>
            </div>
            {plan === "free" && (
              <a href="/pricing" className="text-sm text-[var(--color-accent)] font-medium hover:underline">
                Upgrade to Pro
              </a>
            )}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)] text-center">
              <p className="text-2xl font-bold font-[family-name:var(--font-mono)]">
                {searchesUsed}
              </p>
              <p className="text-xs text-[var(--color-text-dim)] mt-1">
                Searches used
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)] text-center">
              <p className="text-2xl font-bold font-[family-name:var(--font-mono)]">
                {searchesLimit === 999999 ? "∞" : searchesLimit}
              </p>
              <p className="text-xs text-[var(--color-text-dim)] mt-1">
                Search limit
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)] text-center">
              <p className="text-2xl font-bold font-[family-name:var(--font-mono)] capitalize">
                {plan}
              </p>
              <p className="text-xs text-[var(--color-text-dim)] mt-1">
                Current plan
              </p>
            </div>
          </div>
        </section>

        {/* API Access */}
        <section className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
          <div className="flex items-center gap-3 mb-4">
            <Key className="w-5 h-5 text-[var(--color-text-dim)]" />
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              API Access
            </h2>
          </div>
          {plan === "agency" ? (
            <p className="text-sm text-[var(--color-text-secondary)]">
              API access coming soon. You&apos;ll be able to manage API keys here.
            </p>
          ) : (
            <p className="text-sm text-[var(--color-text-secondary)]">
              API access is available on the Agency plan.{" "}
              <a href="/pricing" className="text-[var(--color-accent)] hover:underline">
                Upgrade to unlock
              </a>
            </p>
          )}
        </section>

        {/* Danger Zone */}
        <section className="p-6 rounded-xl border border-red-200 bg-red-50/50">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-red-700">
              Danger Zone
            </h2>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-sm text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              Delete Account
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="text-sm text-white bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, delete my account"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-sm text-[var(--color-text-secondary)] px-4 py-2"
              >
                Cancel
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
