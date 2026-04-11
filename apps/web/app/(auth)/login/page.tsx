"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSubmitted(true);
  }

  return (
    <div className="w-full max-w-md">
      {/* Mobile-only brand header (left panel is hidden on mobile) */}
      <div className="lg:hidden mb-8 text-center">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[var(--color-text-primary)]"
        >
          ByteBoundless
        </Link>
      </div>

      <div className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl p-8 shadow-sm">
        {!submitted ? (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-display)]">
                Welcome back
              </h1>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)] font-[family-name:var(--font-body)]">
                Enter your email to receive a magic link.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-dim)]" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full flex items-center justify-center gap-2 bg-[var(--color-accent)] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Send magic link
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] font-medium transition-colors duration-200"
              >
                Sign up
              </Link>
            </p>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mb-4">
              <Mail className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <h2 className="text-lg font-bold font-[family-name:var(--font-display)]">
              Check your email
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              We sent a magic link to{" "}
              <span className="font-medium text-[var(--color-text-primary)]">
                {email}
              </span>
            </p>
            <p className="mt-3 text-xs text-[var(--color-text-dim)] leading-relaxed">
              Don&apos;t see it? Check your spam or promotions folder. The link
              expires in 1 hour.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setEmail("");
              }}
              className="mt-4 text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] font-medium transition-colors duration-200"
            >
              Try a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
