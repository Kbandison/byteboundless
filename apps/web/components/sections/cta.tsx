"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useGSAP } from "@/hooks/use-gsap";

export function CTA() {
  const ref = useGSAP(({ gsap, isMobile }) => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "[data-cta-section]",
        start: isMobile ? "top 85%" : "top 70%",
      },
    });

    tl.from("[data-cta-heading]", {
      y: isMobile ? 25 : 50,
      opacity: 0,
      duration: 0.7,
      ease: "power2.out",
    })
      .from(
        "[data-cta-sub]",
        {
          y: isMobile ? 15 : 30,
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
        },
        "-=0.4"
      )
      .from(
        "[data-cta-button]",
        {
          y: isMobile ? 10 : 20,
          opacity: 0,
          duration: 0.5,
          ease: "power2.out",
        },
        "-=0.3"
      );
  });

  return (
    <section ref={ref} data-cta-section className="relative py-32 md:py-48">
      {/* Accent gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-accent-3)] to-transparent pointer-events-none" />

      <div className="relative max-w-4xl mx-auto text-center px-6">
        <h2
          data-cta-heading
          className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
        >
          Your next client is already
          <br />
          <span className="text-[var(--color-accent)]">on Google Maps.</span>
        </h2>
        <p
          data-cta-sub
          className="text-[var(--color-text-secondary)] text-lg mb-10 max-w-xl mx-auto"
        >
          Find them before another freelancer does.
        </p>
        <div data-cta-button>
          <Link
            href="/signup"
            className="group inline-flex items-center gap-3 bg-[var(--color-accent)] text-white px-10 py-4 rounded-lg text-base font-medium hover:bg-[var(--color-accent-hover)] transition-all duration-300 hover:shadow-lg"
          >
            Start Finding Leads
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
