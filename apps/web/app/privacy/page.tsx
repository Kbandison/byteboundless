import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "Privacy Policy — ByteBoundless",
  description: "How ByteBoundless handles your data.",
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <div className="pt-32 pb-24">
        <div className="mx-auto max-w-3xl px-6 md:px-8">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-[var(--color-text-dim)] font-[family-name:var(--font-mono)] mb-12">
            Last updated: April 8, 2026
          </p>

          <div className="prose-sm space-y-8 text-[var(--color-text-secondary)] leading-relaxed">
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-text-primary)] mb-3">
                Data We Collect
              </h2>
              <p>
                We collect your email address when you create an account. When you
                run searches, we store your search queries and the resulting
                business data (names, addresses, websites, and publicly available
                contact information scraped from Google Maps and public websites).
              </p>
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-text-primary)] mb-3">
                How We Use Your Data
              </h2>
              <p>
                Your data is used solely to operate the ByteBoundless service:
                running searches, scoring leads, generating AI pitches, and
                managing your saved lists. We do not sell your data to third
                parties.
              </p>
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-text-primary)] mb-3">
                Third-Party Services
              </h2>
              <p>We use the following third-party services:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Supabase — authentication and database</li>
                <li>Stripe — payment processing</li>
                <li>Anthropic (Claude API) — AI pitch generation</li>
                <li>Vercel — hosting</li>
                <li>Railway — worker service hosting</li>
              </ul>
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-text-primary)] mb-3">
                Data Retention
              </h2>
              <p>
                Your search results and saved lists are retained as long as your
                account is active. You can delete your account at any time from
                the Settings page, which will permanently remove all your data
                within 30 days.
              </p>
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-text-primary)] mb-3">
                Contact
              </h2>
              <p>
                For privacy concerns, contact us at{" "}
                <a
                  href="mailto:privacy@byteboundless.io"
                  className="text-[var(--color-accent)] hover:underline"
                >
                  privacy@byteboundless.io
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
