"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { HeroMockup } from "@/components/sections/hero-mockup";

export function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex items-center overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 md:px-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-center py-32 md:py-0">
          {/* Left — Copy */}
          <div className="md:col-span-5">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xs uppercase tracking-[0.15em] text-[var(--color-accent)] font-medium font-[family-name:var(--font-mono)] mb-4"
            >
              Lead intelligence for web developers
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-6"
            >
              Stop cold-calling.{" "}
              <span className="text-[var(--color-accent)]">Start closing.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-[var(--color-text-secondary)] text-base sm:text-lg leading-relaxed mb-8 max-w-lg"
            >
              ByteBoundless finds local businesses with outdated websites,
              scores them by rebuild opportunity, and writes your pitch — so you
              reach out with leverage, not luck.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.65 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 bg-[var(--color-accent)] text-white px-7 py-3.5 rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-all duration-300 hover:shadow-lg"
              >
                Start Finding Leads
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#how-it-works"
                className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-300 px-4 py-3.5"
              >
                See how it works
              </a>
            </motion.div>
          </div>

          {/* Right — Product UI Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="md:col-span-7"
          >
            <HeroMockup />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2"
      >
        <span className="text-xs text-[var(--color-text-dim)] uppercase tracking-widest">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-4 h-4 text-[var(--color-text-dim)]" />
        </motion.div>
      </motion.div>
    </section>
  );
}
