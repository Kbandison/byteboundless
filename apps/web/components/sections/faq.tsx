"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useGSAP } from "@/hooks/use-gsap";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    question: "Is this legal?",
    answer:
      "Yes. We access publicly available business information from Google Maps and public websites. No private data is scraped. No logins are bypassed.",
  },
  {
    question: "How fresh is the data?",
    answer:
      "Every search runs a live scrape. You\u2019re not pulling from a stale database \u2014 the data is collected in real-time when you request it.",
  },
  {
    question: "What tech stacks can you detect?",
    answer:
      "Wix, Squarespace, WordPress, GoDaddy, Weebly, Duda, Webflow, Shopify, Next.js, and React. We also detect missing mobile viewports, expired SSL, and other staleness signals.",
  },
  {
    question: "How does the lead score work?",
    answer:
      "Our scoring algorithm weighs 12+ signals: tech stack age, mobile-friendliness, page speed indicators, social presence, review count, claimed status, and more. A score of 80+ means \u201cthis business would likely benefit from a new website.\u201d",
  },
  {
    question: "Can I export the data?",
    answer:
      "Pro and Agency plans support CSV export and saved lists.",
  },
  {
    question: "What\u2019s the AI pitch?",
    answer:
      "When you click into a lead, our AI analyzes the business\u2019s enrichment data and generates a specific pitch angle, three improvement suggestions, and a draft outreach email. No generic templates \u2014 every pitch is tied to real data.",
  },
];

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-[var(--color-border)]">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-medium pr-8">{question}</span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-[var(--color-text-dim)] transition-transform duration-300 shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed pb-5">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const ref = useGSAP(({ gsap, isMobile, el }) => {
    gsap.from(el.querySelectorAll("[data-faq-heading]"), {
      scrollTrigger: { trigger: el, start: isMobile ? "top 90%" : "top 75%" },
      y: isMobile ? 20 : 40,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
    });
  });

  return (
    <section
      ref={ref}
      data-faq-section
      className="relative py-24 md:py-32 bg-[var(--color-bg-secondary)]"
    >
      <div className="mx-auto max-w-3xl px-6 md:px-8">
        <h2
          data-faq-heading
          className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold tracking-tight mb-12"
        >
          Questions
        </h2>

        <div>
          {FAQS.map((faq, i) => (
            <FAQItem
              key={i}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
