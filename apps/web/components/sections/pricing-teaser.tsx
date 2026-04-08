"use client";

import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import { useGSAP } from "@/hooks/use-gsap";
import { cn } from "@/lib/utils";

const TIERS = [
  {
    name: "Free Trial",
    price: "$0",
    period: "",
    description: "Try it out. No credit card required.",
    features: [
      { text: "3 searches total", included: true },
      { text: "50 results per search", included: true },
      { text: "Basic scoring", included: true },
      { text: "AI pitch generation", included: false },
      { text: "Saved lists", included: false },
      { text: "CSV export", included: false },
    ],
    cta: "Start Free",
    href: "/signup",
    featured: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "For active freelancers finding clients.",
    features: [
      { text: "Unlimited searches", included: true },
      { text: "200 results per search", included: true },
      { text: "Advanced AI scoring", included: true },
      { text: "AI pitch generation", included: true },
      { text: "Saved lists", included: true },
      { text: "CSV export", included: true },
    ],
    cta: "Go Pro",
    href: "/signup",
    featured: true,
  },
  {
    name: "Agency",
    price: "$79",
    period: "/mo",
    description: "For teams scaling outreach.",
    features: [
      { text: "Unlimited searches", included: true },
      { text: "500 results per search", included: true },
      { text: "Advanced AI scoring", included: true },
      { text: "Premium AI pitches (Sonnet)", included: true },
      { text: "Up to 5 team seats", included: true },
      { text: "Priority scraping + API", included: true },
    ],
    cta: "Contact Us",
    href: "/signup",
    featured: false,
  },
];

export function PricingTeaser() {
  const ref = useGSAP(({ gsap }) => {
    gsap.from("[data-pricing-heading]", {
      scrollTrigger: {
        trigger: "[data-pricing-section]",
        start: "top 75%",
      },
      y: 40,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
    });

    gsap.from("[data-pricing-card]", {
      scrollTrigger: {
        trigger: "[data-pricing-section]",
        start: "top 60%",
      },
      y: 50,
      opacity: 0,
      duration: 0.7,
      stagger: 0.12,
      ease: "power2.out",
    });
  });

  return (
    <section
      ref={ref}
      data-pricing-section
      className="relative py-24 md:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div data-pricing-heading className="text-center mb-16">
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Built for freelancers, priced for freelancers
          </h2>
          <p className="text-[var(--color-text-secondary)] max-w-md mx-auto">
            Start free. Upgrade when the leads start paying for themselves.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              data-pricing-card
              className={cn(
                "relative p-8 rounded-xl border transition-all duration-500",
                tier.featured
                  ? "border-[var(--color-accent)]/30 bg-[var(--color-bg-tertiary)] shadow-lg shadow-[var(--color-accent)]/5"
                  : "border-[var(--color-border)] bg-[var(--color-bg-tertiary)] hover:border-[var(--color-border-hover)]"
              )}
            >
              {tier.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest font-medium bg-[var(--color-accent)] text-white px-3 py-1 rounded-full">
                  Popular
                </span>
              )}

              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold mb-1">
                {tier.name}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                {tier.description}
              </p>

              <div className="mb-8">
                <span className="text-4xl font-bold font-[family-name:var(--font-display)] tracking-tight">
                  {tier.price}
                </span>
                {tier.period && (
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {tier.period}
                  </span>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    {feature.included ? (
                      <Check className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                    ) : (
                      <Minus className="w-4 h-4 text-[var(--color-text-dim)] shrink-0" />
                    )}
                    <span
                      className={
                        feature.included
                          ? "text-[var(--color-text-primary)]"
                          : "text-[var(--color-text-dim)]"
                      }
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={cn(
                  "w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 group",
                  tier.featured
                    ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
                    : "border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                )}
              >
                {tier.cta}
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/pricing"
            className="text-sm text-[var(--color-accent)] hover:underline"
          >
            See full pricing details &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
