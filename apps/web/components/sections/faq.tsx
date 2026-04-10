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
      "Our scoring algorithm weighs 12+ signals: tech stack age, mobile-friendliness, Lighthouse performance + SEO + accessibility scores, social presence, review count, claimed status, and more. A score of 80+ means \u201cthis business would likely benefit from a new website.\u201d",
  },
  {
    question: "How do I track my outreach?",
    answer:
      "Every lead you save lands in a built-in pipeline: Saved \u2192 Contacted \u2192 Replied \u2192 Quoted \u2192 Signed (or Lost). Tag the deal amount when you close. Filter your results table by status to see what you\u2019ve already touched. No spreadsheets, no separate CRM.",
  },
  {
    question: "Can I qualify URLs I already have?",
    answer:
      "Yes. Switch to URL Import mode in the New Search screen and paste any list of websites \u2014 we\u2019ll run the same enrichment, scoring, and pitch generation on them, no Google Maps scrape required. Useful when you already have a prospect list from another source.",
  },
  {
    question: "Can I work with multiple leads at once?",
    answer:
      "Yes. The results table supports bulk selection \u2014 check off any number of leads to save them all to a list, mark them all contacted, or export them to CSV in one click. Built for outreach at scale.",
  },
  {
    question: "Can I export the data?",
    answer:
      "Pro and Agency plans support CSV export \u2014 either the whole result set or just the rows you\u2019ve selected. Includes every column: score, contact info, tech stack, ratings, and address.",
  },
  {
    question: "What\u2019s the AI pitch?",
    answer:
      "When you click into a lead, our AI analyzes the business\u2019s enrichment data and generates a specific pitch angle, three improvement suggestions, and a draft outreach email. No generic templates \u2014 every pitch is tied to real data, including the Lighthouse audit results.",
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
    gsap.fromTo(
      el.querySelectorAll("[data-faq-heading]"),
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
