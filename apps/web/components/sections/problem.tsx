"use client";

import { Search, Eye, Send } from "lucide-react";
import { useGSAP } from "@/hooks/use-gsap";

const PROBLEMS = [
  {
    icon: Search,
    title: '"Googling businesses" isn\'t a strategy.',
    description:
      "You search, click, squint at bad websites, guess who might pay. It's slow and random.",
  },
  {
    icon: Eye,
    title: "You can't tell who actually needs help.",
    description:
      "A business on Wix from 2015 is a better lead than one on Shopify from last month. But you can't see that from a Google listing.",
  },
  {
    icon: Send,
    title: "Cold outreach without data is just spam.",
    description:
      'Generic "I can build you a website" emails get deleted. Specific pitches backed by real intel get replies.',
  },
];

export function Problem() {
  const ref = useGSAP(({ gsap, isMobile }) => {
    const start = isMobile ? "top 90%" : "top 75%";
    const cardStart = isMobile ? "top 85%" : "top 65%";

    gsap.from("[data-problem-title]", {
      scrollTrigger: { trigger: "[data-problem-section]", start },
      y: isMobile ? 20 : 40,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
    });

    gsap.from("[data-problem-card]", {
      scrollTrigger: { trigger: "[data-problem-section]", start: cardStart },
      y: isMobile ? 25 : 50,
      opacity: 0,
      duration: 0.6,
      stagger: 0.12,
      ease: "power2.out",
    });
  });

  return (
    <section
      ref={ref}
      data-problem-section
      className="relative py-24 md:py-32 bg-[var(--color-bg-secondary)]"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <h2
          data-problem-title
          className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold tracking-tight mb-16 max-w-md"
        >
          The freelancer&apos;s lead problem
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROBLEMS.map((problem, i) => (
            <div
              key={i}
              data-problem-card
              className="group relative p-8 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-tertiary)] hover:border-[var(--color-accent)]/30 transition-all duration-500"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center mb-5">
                <problem.icon className="w-5 h-5 text-[var(--color-accent)]" />
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold mb-3 leading-snug">
                {problem.title}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
