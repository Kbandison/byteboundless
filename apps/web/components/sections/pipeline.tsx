"use client";

import { Bookmark, Send, MessageCircle, FileText, Trophy } from "lucide-react";
import { useGSAP } from "@/hooks/use-gsap";
import { cn } from "@/lib/utils";

const STAGES = [
  {
    icon: Bookmark,
    label: "Saved",
    count: 142,
    color: "text-[var(--color-accent)]",
    bg: "bg-[var(--color-accent)]/10",
    border: "border-[var(--color-accent)]/20",
  },
  {
    icon: Send,
    label: "Contacted",
    count: 38,
    color: "text-amber-600",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  {
    icon: MessageCircle,
    label: "Replied",
    count: 12,
    color: "text-violet-600",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
  {
    icon: FileText,
    label: "Quoted",
    count: 5,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    icon: Trophy,
    label: "Signed",
    count: 2,
    sub: "$8,400",
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
];

export function Pipeline() {
  const ref = useGSAP(({ gsap, isMobile, el }) => {
    gsap.fromTo(
      el.querySelectorAll("[data-pipeline-heading]"),
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
      el.querySelectorAll("[data-pipeline-stage]"),
      { y: isMobile ? 25 : 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.1,
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
      data-pipeline-section
      className="relative py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div data-pipeline-heading className="mb-16 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-accent)] font-medium font-[family-name:var(--font-mono)] mb-3">
            Track every pitch
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Built-in pipeline,
            <br />
            no spreadsheet required
          </h2>
          <p className="text-[var(--color-text-secondary)] leading-relaxed">
            Every lead you save becomes part of your outreach pipeline. Mark
            them contacted, log replies, attach quotes, and tag the ones that
            close — with the deal amount. ByteBoundless tracks what works so
            you can double down on it.
          </p>
        </div>

        {/* Pipeline visualization — desktop */}
        <div className="hidden md:grid grid-cols-5 gap-3">
          {STAGES.map((stage, i) => (
            <div
              key={stage.label}
              data-pipeline-stage
              className={cn(
                "relative p-6 rounded-2xl border bg-[var(--color-bg-tertiary)] transition-all duration-300",
                stage.border
              )}
            >
              {/* Connector arrow to next stage */}
              {i < STAGES.length - 1 && (
                <div className="absolute top-1/2 -right-3 -translate-y-1/2 z-10 hidden md:flex items-center justify-center">
                  <div className="w-6 h-px bg-[var(--color-border)]" />
                </div>
              )}

              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center mb-4",
                  stage.bg
                )}
              >
                <stage.icon className={cn("w-5 h-5", stage.color)} />
              </div>
              <p
                className={cn(
                  "font-[family-name:var(--font-mono)] text-3xl font-bold tracking-tight",
                  stage.color
                )}
              >
                {stage.count}
              </p>
              <p className="text-xs text-[var(--color-text-dim)] uppercase tracking-wider font-medium mt-1">
                {stage.label}
              </p>
              {stage.sub && (
                <p
                  className={cn(
                    "text-xs font-[family-name:var(--font-mono)] font-semibold mt-2",
                    stage.color
                  )}
                >
                  {stage.sub}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Mobile — horizontal scroll */}
        <div className="md:hidden flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 snap-x snap-mandatory">
          {STAGES.map((stage) => (
            <div
              key={stage.label}
              data-pipeline-stage
              className={cn(
                "shrink-0 w-40 snap-start p-5 rounded-2xl border bg-[var(--color-bg-tertiary)]",
                stage.border
              )}
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center mb-3",
                  stage.bg
                )}
              >
                <stage.icon className={cn("w-4 h-4", stage.color)} />
              </div>
              <p
                className={cn(
                  "font-[family-name:var(--font-mono)] text-2xl font-bold tracking-tight",
                  stage.color
                )}
              >
                {stage.count}
              </p>
              <p className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider font-medium mt-1">
                {stage.label}
              </p>
              {stage.sub && (
                <p
                  className={cn(
                    "text-xs font-[family-name:var(--font-mono)] font-semibold mt-2",
                    stage.color
                  )}
                >
                  {stage.sub}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Below: bulk actions callout */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
            <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold mb-2">
              Bulk-action workflow
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Select 50 leads with one click. Save them all to a list, mark
              them all contacted, or export them to CSV. ByteBoundless is
              built for outreach at scale, not lead-by-lead clicking.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
            <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold mb-2">
              Filter by what matters
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Filter by score, tech stack, contact info, or outreach status.
              Sort by anything. Find &ldquo;hot leads on Wix with a phone
              number that I haven&apos;t contacted yet&rdquo; in three clicks.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
