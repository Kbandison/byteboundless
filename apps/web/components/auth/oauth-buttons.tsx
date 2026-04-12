"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Inline brand SVG paths so we don't pull in a separate icon library.
// Lucide doesn't ship brand marks (Google/GitHub/etc) for trademark
// reasons, so we draw them ourselves.

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

type Provider = "google" | "github";

interface OAuthButtonsProps {
  /**
   * Optional `next` query param to thread through the auth callback so
   * the user lands on a specific page after sign-in (e.g. checkout).
   * Same allowlist enforcement as the magic-link flow — anything not
   * on the callback's allowlist falls back to /dashboard.
   */
  next?: string;
}

export function OAuthButtons({ next }: OAuthButtonsProps) {
  const [loading, setLoading] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signInWith(provider: Provider) {
    setLoading(provider);
    setError(null);

    // Build the post-auth redirect target. The auth callback handles
    // the OAuth code exchange and then forwards to `next` (sanitized
    // server-side against an allowlist).
    const callbackUrl = next
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      : `${window.location.origin}/auth/callback`;

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(null);
    }
    // On success the browser is already navigating to the OAuth
    // provider — no need to clear loading state, the next page handles it.
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={() => signInWith("google")}
        disabled={loading !== null}
        className="w-full flex items-center justify-center gap-3 bg-white border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm font-medium px-5 py-2.5 rounded-lg hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        {loading === "google" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <GoogleIcon className="w-4 h-4" />
        )}
        Continue with Google
      </button>

      <button
        type="button"
        onClick={() => signInWith("github")}
        disabled={loading !== null}
        className="w-full flex items-center justify-center gap-3 bg-[#24292e] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[#1a1e22] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        {loading === "github" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <GitHubIcon className="w-4 h-4" />
        )}
        Continue with GitHub
      </button>
    </div>
  );
}

/**
 * Visual divider with "or with email" text. Pair with OAuthButtons
 * above and the email/magic-link form below.
 */
export function OAuthDivider() {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-[var(--color-border)]" />
      <span className="text-xs text-[var(--color-text-dim)] uppercase tracking-wider">
        or with email
      </span>
      <div className="flex-1 h-px bg-[var(--color-border)]" />
    </div>
  );
}
