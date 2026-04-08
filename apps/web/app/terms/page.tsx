import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "Terms of Service — ByteBoundless",
  description: "Terms governing the use of ByteBoundless.",
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <div className="pt-32 pb-24">
        <div className="mx-auto max-w-3xl px-6 md:px-8">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight mb-2">
            Terms of Service
          </h1>
          <p className="text-sm text-[var(--color-text-dim)] font-[family-name:var(--font-mono)] mb-12">
            Last updated: April 8, 2026
          </p>

          <div className="prose-sm space-y-8 text-[var(--color-text-secondary)] leading-relaxed">
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-text-primary)] mb-3">
                Acceptable Use
              </h2>
              <p>
                ByteBoundless is designed for legitimate lead generation by
                freelance web developers and agencies. You agree not to abuse the
                scraping service, bypass rate limits, or use the data for
                purposes unrelated to web development outreach.
              </p>
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-text-primary)] mb-3">
                Service Availability
              </h2>
              <p>
                We provide the service on a best-effort basis. Scraping results
                depend on the availability and structure of third-party websites
                and Google Maps. We do not guarantee specific result counts,
                accuracy of enrichment data, or uptime.
              </p>
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-text-primary)] mb-3">
                Payments
              </h2>
              <p>
                Paid plans are billed monthly through Stripe. Subscriptions
                auto-renew unless cancelled. You can cancel at any time from
                your Settings page. Refunds are handled on a case-by-case basis.
              </p>
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-text-primary)] mb-3">
                Intellectual Property
              </h2>
              <p>
                The business data collected through our service is publicly
                available information. You own the saved lists and pitch content
                generated for your account. We retain no rights over your
                exported data.
              </p>
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-text-primary)] mb-3">
                Limitation of Liability
              </h2>
              <p>
                ByteBoundless is provided &ldquo;as is&rdquo; without warranties of any kind.
                We are not liable for any indirect, incidental, or consequential
                damages arising from your use of the service, including lost
                revenue or business opportunities.
              </p>
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-text-primary)] mb-3">
                Contact
              </h2>
              <p>
                Questions about these terms? Contact us at{" "}
                <a
                  href="mailto:legal@byteboundless.com"
                  className="text-[var(--color-accent)] hover:underline"
                >
                  legal@byteboundless.com
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
