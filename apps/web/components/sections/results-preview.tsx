"use client";

import { useGSAP } from "@/hooks/use-gsap";
import { HeroMockup } from "@/components/sections/hero-mockup";

export function ResultsPreview() {
  const ref = useGSAP(({ gsap, isMobile }) => {
    gsap.from("[data-rp-heading]", {
      scrollTrigger: { trigger: "[data-rp-section]", start: isMobile ? "top 90%" : "top 75%" },
      y: isMobile ? 20 : 40,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
    });

    gsap.from("[data-rp-mockup]", {
      scrollTrigger: { trigger: "[data-rp-section]", start: isMobile ? "top 85%" : "top 65%" },
      y: isMobile ? 30 : 60,
      opacity: 0,
      scale: 0.98,
      duration: 1,
      ease: "power2.out",
    });
  });

  return (
    <section
      ref={ref}
      data-rp-section
      className="relative py-24 md:py-32 bg-[var(--color-bg-secondary)]"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div data-rp-heading className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-accent)] font-medium font-[family-name:var(--font-mono)] mb-3">
            Results
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold tracking-tight mb-4">
            See what you get
          </h2>
          <p className="text-[var(--color-text-secondary)] max-w-lg mx-auto">
            Every search returns a scored, filterable list of businesses —
            ranked by how much they need a better website.
          </p>
        </div>

        <div data-rp-mockup className="max-w-4xl mx-auto">
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}
