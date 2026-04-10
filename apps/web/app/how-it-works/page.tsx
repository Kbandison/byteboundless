import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "How It Works — ByteBoundless",
  description: "From search to signed client — see the full ByteBoundless workflow.",
};

export default function HowItWorksPage() {
  return (
    <>
      <Navbar />
      <div className="pt-24">
        <HowItWorks />

        {/* Detailed sections */}
        <section className="py-24 md:py-32 bg-[var(--color-bg-secondary)]">
          <div className="mx-auto max-w-3xl px-6 md:px-8 space-y-16">
            <div>
              <span className="text-xs font-[family-name:var(--font-mono)] text-[var(--color-accent)] mb-3 block">
                Enrichment Details
              </span>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight mb-4">
                What we detect on every website
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  "Tech stack (Wix, WordPress, Squarespace, and 7 more)",
                  "Contact emails (business vs. developer)",
                  "Social profiles across 6 platforms",
                  "Mobile viewport presence",
                  "SSL certificate validity",
                  "Content staleness signals",
                  "Lighthouse audit (Performance, SEO, Accessibility)",
                  "Google Business claimed status",
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]"
                  >
                    <span className="text-xs font-[family-name:var(--font-mono)] text-[var(--color-accent)] font-medium mt-0.5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-[family-name:var(--font-mono)] text-[var(--color-accent)] mb-3 block">
                AI Scoring
              </span>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight mb-4">
                How the lead score works
              </h2>
              <p className="text-[var(--color-text-secondary)] leading-relaxed mb-6">
                Our scoring algorithm weighs 12+ signals to produce a 0&ndash;100
                score representing how likely a business would benefit from a
                website rebuild. Higher scores mean more opportunity for you.
              </p>
              <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
                <p className="text-sm italic text-[var(--color-text-secondary)]">
                  &ldquo;This business runs Wix, has no mobile viewport, 2 reviews,
                  and hasn&apos;t updated their site in 18 months.{" "}
                  <span className="text-emerald-600 font-semibold not-italic">
                    Score: 87.
                  </span>
                  &rdquo;
                </p>
              </div>
            </div>

            <div>
              <span className="text-xs font-[family-name:var(--font-mono)] text-[var(--color-accent)] mb-3 block">
                Pitch Generation
              </span>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight mb-4">
                AI writes your outreach
              </h2>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                When you open a lead detail, our AI reads the enrichment data and
                generates a pitch angle, three specific improvement suggestions
                tied to real signals, and a draft outreach email. Every pitch is
                unique because it&apos;s built from that business&apos;s actual data — not
                a template.
              </p>
            </div>

            <div>
              <span className="text-xs font-[family-name:var(--font-mono)] text-[var(--color-accent)] mb-3 block">
                Outreach Pipeline
              </span>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight mb-4">
                Track every lead from save to signed
              </h2>
              <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
                Save a lead and it lands in your built-in pipeline:{" "}
                <span className="text-[var(--color-text-primary)] font-medium">
                  Saved → Contacted → Replied → Quoted → Signed
                </span>{" "}
                (with a Lost lane for the ones that didn&apos;t pan out). Tag the
                deal amount when you close so you can see exactly which campaigns
                pay off.
              </p>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                Filter the results table by status to instantly see who you&apos;ve
                already contacted, who&apos;s gone quiet, and who&apos;s ready
                for a follow-up.
              </p>
            </div>

            <div>
              <span className="text-xs font-[family-name:var(--font-mono)] text-[var(--color-accent)] mb-3 block">
                Bulk Workflow
              </span>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight mb-4">
                Built for outreach at scale
              </h2>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                Select 50 leads with one click. Save them all to a list, mark
                them all contacted, or export them to CSV. Filter by score, tech
                stack, contact info, and outreach status to find exactly the
                slice you want — &ldquo;hot leads on Wix with a phone number I
                haven&apos;t contacted yet&rdquo; in three clicks. Sort by anything.
                ByteBoundless is a tool, not a click-fest.
              </p>
            </div>

            <div>
              <span className="text-xs font-[family-name:var(--font-mono)] text-[var(--color-accent)] mb-3 block">
                URL Import
              </span>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight mb-4">
                Already have a list? Skip the scrape.
              </h2>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                If you already have a list of business websites — from a referral,
                an industry directory, or a previous campaign — paste them into
                URL Import mode. We&apos;ll run the same enrichment, scoring, and
                AI pitch generation on them, no Google Maps scrape required.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center px-6">
            <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold tracking-tight mb-6">
              Ready to find your next client?
            </h2>
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 bg-[var(--color-accent)] text-white px-8 py-3.5 rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-all duration-300"
            >
              Start Finding Leads
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
