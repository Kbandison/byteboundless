import Link from "next/link";
import { CheckCircle2, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Unsubscribed — ByteBoundless",
  robots: { index: false, follow: false },
};

/**
 * Confirmation page shown after a user clicks an unsubscribe link in an
 * email. Rendered as a server component so it works even when the user
 * is logged out (the unsubscribe endpoint doesn't require auth — it
 * verifies via HMAC signature instead).
 */
export default async function UnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; error?: string }>;
}) {
  const { kind, error } = await searchParams;
  const isError = Boolean(error);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center bg-[var(--color-bg-primary)]">
      <div className="max-w-md w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] p-8 md:p-10">
        <div
          className={`w-12 h-12 rounded-full mx-auto mb-5 flex items-center justify-center ${
            isError ? "bg-red-500/10" : "bg-emerald-500/10"
          }`}
        >
          {isError ? (
            <AlertCircle className="w-6 h-6 text-red-600" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          )}
        </div>

        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight mb-2">
          {isError
            ? "Couldn't unsubscribe"
            : kind === "subscription" || kind === "beta"
              ? "These emails are required"
              : "You're unsubscribed"}
        </h1>

        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
          {isError ? (
            <>
              We couldn&apos;t process the unsubscribe request. The link may be
              expired or invalid. You can manage your notification preferences
              from your account settings.
            </>
          ) : kind === "notify_on_complete" ? (
            <>
              We won&apos;t send you search-completion emails anymore. In-app
              progress still shows in your dashboard, and you can re-enable
              these emails any time from your settings.
            </>
          ) : kind === "subscription" ? (
            <>
              Subscription emails (payment failures, cancellations, receipts)
              are transactional and can&apos;t be turned off while you have an
              active account. You can manage other email preferences below.
            </>
          ) : kind === "beta" ? (
            <>
              Beta access reminders are transactional and only sent while you
              have an active beta membership. They stop automatically once
              your beta expires.
            </>
          ) : (
            <>Your notification preference has been updated.</>
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/settings#notifications"
            className="inline-flex items-center justify-center text-sm bg-[var(--color-accent)] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            Manage preferences
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-5 py-2.5 rounded-lg border border-[var(--color-border)] transition-colors"
          >
            Back to homepage
          </Link>
        </div>
      </div>

      <p className="mt-6 text-[11px] text-[var(--color-text-dim)]">
        ByteBoundless &mdash; Lead intelligence for freelance web developers
      </p>
    </div>
  );
}
