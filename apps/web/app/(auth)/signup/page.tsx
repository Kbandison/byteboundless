"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/brand/wordmark";

export default function SignupPage() {
  // useSearchParams requires a Suspense boundary at the page level during
  // prerendering. The actual form logic lives in SignupForm below.
  return (
    <Suspense fallback={<div className="w-full max-w-md" />}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const searchParams = useSearchParams();
  const planIntent = searchParams.get("plan");
  const isValidPlan = planIntent === "pro" || planIntent === "agency";

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    // If the user arrived with a ?plan= query param from the pricing
    // page, thread it through the magic-link flow so they land on the
    // checkout handoff page after authenticating instead of the
    // dashboard. The auth callback reads `next` and redirects there.
    const next = isValidPlan ? `/auth/checkout?plan=${planIntent}` : undefined;
    const callbackUrl = next
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      : `${window.location.origin}/auth/callback`;

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl,
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
      <div className="lg:hidden mb-8 flex justify-center">
        <Link href="/" aria-label="ByteBoundless home">
          <Wordmark className="h-7 w-auto" />
        </Link>
      </div>

      <div className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl p-8 shadow-sm">
        {!submitted ? (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-display)]">
                {isValidPlan
                  ? `Sign up for ${planIntent === "pro" ? "Pro" : "Agency"}`
                  : "Create your account"}
              </h1>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)] font-[family-name:var(--font-body)]">
                {isValidPlan
                  ? "Enter your email — we'll send you a magic link and take you straight to checkout after you sign in."
                  : "Enter your email to get started with a magic link."}
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
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] font-medium transition-colors duration-200"
              >
                Log In
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
