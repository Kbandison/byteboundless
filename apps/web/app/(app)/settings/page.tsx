"use client";

import { useState } from "react";
import { User, CreditCard, Key, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const [email] = useState("dev@example.com");

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
            </div>
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
              <p className="text-sm font-medium">Free Trial</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                3 searches remaining
              </p>
            </div>
            <button className="text-sm text-[var(--color-accent)] font-medium hover:underline">
              Upgrade to Pro
            </button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)] text-center">
              <p className="text-2xl font-bold font-[family-name:var(--font-mono)]">
                0
              </p>
              <p className="text-xs text-[var(--color-text-dim)] mt-1">
                Searches used
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)] text-center">
              <p className="text-2xl font-bold font-[family-name:var(--font-mono)]">
                0
              </p>
              <p className="text-xs text-[var(--color-text-dim)] mt-1">
                Results generated
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)] text-center">
              <p className="text-2xl font-bold font-[family-name:var(--font-mono)]">
                0
              </p>
              <p className="text-xs text-[var(--color-text-dim)] mt-1">
                Pitches generated
              </p>
            </div>
          </div>
        </section>

        {/* API */}
        <section className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
          <div className="flex items-center gap-3 mb-4">
            <Key className="w-5 h-5 text-[var(--color-text-dim)]" />
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              API Access
            </h2>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            API access is available on the Agency plan.{" "}
            <button className="text-[var(--color-accent)] hover:underline">
              Upgrade to unlock
            </button>
          </p>
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
          <button className="text-sm text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">
            Delete Account
          </button>
        </section>
      </div>
    </div>
  );
}
