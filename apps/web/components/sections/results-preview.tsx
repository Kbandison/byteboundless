"use client";

import { useGSAP } from "@/hooks/use-gsap";
import { HeroMockup } from "@/components/sections/hero-mockup";

export function ResultsPreview() {
  const ref = useGSAP(({ gsap, isMobile, el }) => {
    gsap.fromTo(
      el.querySelectorAll("[data-rp-heading]"),
      { y: isMobile ? 20 : 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: "power2.out",
        immediateRender: false,
        scrollTrigger: {
          trigger: el,
          start: isMobile ? "top 95%" : "top 85%",
          toggleActions: "play none none none",
        },
      }
    );

    gsap.fromTo(
      el.querySelectorAll("[data-rp-mockup]"),
      { y: isMobile ? 30 : 60, opacity: 0, scale: 0.98 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: "power2.out",
        immediateRender: false,
        scrollTrigger: {
          trigger: el,
          start: isMobile ? "top 92%" : "top 80%",
          toggleActions: "play none none none",
        },
      }
    );
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
