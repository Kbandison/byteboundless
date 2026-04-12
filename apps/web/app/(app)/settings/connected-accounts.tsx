"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

// Same inline SVGs as the OAuth buttons — keep them consistent.
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
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

interface ProviderConfig {
  provider: Provider;
  label: string;
  icon: typeof GoogleIcon;
}

const PROVIDERS: ProviderConfig[] = [
  { provider: "google", label: "Google", icon: GoogleIcon },
  { provider: "github", label: "GitHub", icon: GitHubIcon },
];

interface LinkedIdentity {
  provider: string;
  identity_id: string;
  email?: string;
  created_at?: string;
}

export function ConnectedAccounts() {
  const [identities, setIdentities] = useState<LinkedIdentity[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<Provider | null>(null);

  const fetchIdentities = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Supabase stores linked providers in user.identities. Each
    // identity has a `provider` string (e.g. "google", "github",
    // "email") and metadata about when it was linked.
    const linked: LinkedIdentity[] =
      (user.identities ?? []).map((id) => ({
        provider: id.provider,
        identity_id: id.identity_id ?? id.id,
        email: (id.identity_data as Record<string, string> | undefined)?.email,
        created_at: id.created_at,
      }));
    setIdentities(linked);
    setLoading(false);
  }, []);

  // fetchIdentities is async — setState calls happen after awaits,
  // so they're in a later microtask and not "synchronously within an
  // effect." The lint rule can't see through the function call.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchIdentities();
  }, [fetchIdentities]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function isLinked(provider: Provider): boolean {
    return identities.some((id) => id.provider === provider);
  }

  function getIdentity(provider: Provider): LinkedIdentity | undefined {
    return identities.find((id) => id.provider === provider);
  }

  async function connect(provider: Provider) {
    setConnecting(provider);
    const supabase = createClient();

    // linkIdentity opens the OAuth consent screen for the provider.
    // On success, Supabase links the new identity to the current
    // user and redirects back here. On failure, we surface the
    // error and reset the loading state.
    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: `${window.location.origin}/settings#accounts`,
      },
    });

    if (error) {
      toast.error(error.message || `Failed to connect ${provider}`);
      setConnecting(null);
    }
    // On success the browser navigates to the OAuth provider, so
    // clearing the loading state is unnecessary — the next page load
    // refetches identities and shows the newly linked account.
  }

  async function disconnect(provider: Provider) {
    const identity = getIdentity(provider);
    if (!identity) return;

    // Don't let the user unlink their last identity — they'd be
    // locked out with no way to sign back in.
    if (identities.length <= 1) {
      toast.error("You can't disconnect your only sign-in method");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.unlinkIdentity({
      provider: identity.provider,
      identity_id: identity.identity_id,
    } as never);

    if (error) {
      toast.error(error.message || `Failed to disconnect ${provider}`);
      return;
    }

    toast.success(`${provider === "google" ? "Google" : "GitHub"} disconnected`);
    await fetchIdentities();
  }

  if (loading) {
    return (
      <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] flex justify-center">
        <Loader2 className="w-5 h-5 text-[var(--color-text-dim)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {PROVIDERS.map(({ provider, label, icon: Icon }) => {
        const linked = isLinked(provider);
        const identity = getIdentity(provider);
        return (
          <div
            key={provider}
            className="flex items-center justify-between gap-4 p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-secondary)] flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {label}
                </p>
                {linked && identity?.email ? (
                  <p className="text-xs text-[var(--color-text-dim)] truncate">
                    {identity.email}
                  </p>
                ) : linked ? (
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Connected
                  </p>
                ) : (
                  <p className="text-xs text-[var(--color-text-dim)]">
                    Not connected
                  </p>
                )}
              </div>
            </div>

            {linked ? (
              <button
                onClick={() => disconnect(provider)}
                className="text-xs text-[var(--color-text-secondary)] hover:text-red-600 font-medium transition-colors"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={() => connect(provider)}
                disabled={connecting !== null}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:underline font-medium disabled:opacity-50"
              >
                {connecting === provider ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <ExternalLink className="w-3 h-3" />
                )}
                Connect
              </button>
            )}
          </div>
        );
      })}

      <p className="text-[11px] text-[var(--color-text-dim)] mt-4 leading-relaxed">
        Connected accounts let you sign in with one click instead of waiting
        for a magic link email. Your data stays the same regardless of which
        method you use — they all point to the same ByteBoundless account.
      </p>
    </div>
  );
}
