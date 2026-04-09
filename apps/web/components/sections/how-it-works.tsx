"use client";

import { MapPin, Scan, Sparkles } from "lucide-react";
import { useGSAP } from "@/hooks/use-gsap";

const STEPS = [
  {
    number: "01",
    icon: MapPin,
    title: "Search",
    description:
      'Enter a business category and location. "Plumbers in Austin" or "Dentists in Buford, GA." We scrape Google Maps for every matching business.',
  },
  {
    number: "02",
    icon: Scan,
    title: "Enrich",
    description:
      "We visit every website, detect their tech stack, find contact emails, check social profiles, and flag staleness signals like expired SSL or no mobile viewport.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Score & Pitch",
    description:
      "Our AI ranks every lead 0\u2013100 by rebuild opportunity and generates a tailored pitch angle. You get a sorted list of businesses that actually need your help.",
  },
];

export function HowItWorks() {
  const ref = useGSAP(({ gsap, isMobile, el }) => {
    gsap.from(el.querySelectorAll("[data-hiw-heading]"), {
      scrollTrigger: { trigger: el, start: isMobile ? "top 90%" : "top 75%" },
      y: isMobile ? 20 : 40,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
    });

    gsap.from(el.querySelectorAll("[data-hiw-step]"), {
      scrollTrigger: { trigger: el, start: isMobile ? "top 85%" : "top 60%" },
      y: isMobile ? 25 : 50,
      opacity: 0,
      duration: 0.7,
      stagger: 0.15,
      ease: "power2.out",
    });
  });

  return (
    <section
      ref={ref}
      id="how-it-works"
      data-hiw-section
      className="relative py-24 md:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div data-hiw-heading className="mb-16">
          <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-accent)] font-medium font-[family-name:var(--font-mono)] mb-3">
            How it works
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold tracking-tight max-w-md">
            Three steps to qualified leads
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {STEPS.map((step) => (
            <div key={step.number} data-hiw-step className="relative">
              <span className="text-xs font-[family-name:var(--font-mono)] text-[var(--color-accent)] mb-4 block">
                {step.number}
              </span>
              <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-center justify-center mb-5">
                <step.icon className="w-5 h-5 text-[var(--color-text-primary)]" />
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold mb-3">
                {step.title}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
