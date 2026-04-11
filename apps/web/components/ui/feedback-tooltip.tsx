"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquarePlus, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * One-time discovery callout for the new /feedback feature. Shows on
 * the first authenticated page load, points users at the sidebar link,
 * and disappears permanently once dismissed.
 *
 * Storage key is versioned so we can force it to re-appear if we ever
 * overhaul the feedback feature. The component renders nothing on the
 * feedback page itself (no point reminding someone about a feature
 * they're already using).
 */
const STORAGE_KEY = "bb-feedback-tooltip-v1";

export function FeedbackTooltip() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Don't re-show on pages where the feedback link would be redundant
    if (pathname.startsWith("/feedback")) return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;
    // Brief delay so the page settles before the callout appears —
    // otherwise it fires in the middle of the template fade and
    // fights for attention with the rest of the UI.
    const t = setTimeout(() => setVisible(true), 900);
    return () => clearTimeout(t);
  }, [pathname]);

  function dismiss() {
    setVisible(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "1");
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96, transition: { duration: 0.2 } }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-6 right-6 z-[60] max-w-xs rounded-2xl border border-[var(--color-accent)]/30 bg-[var(--color-bg-tertiary)] shadow-xl shadow-[var(--color-accent)]/10 overflow-hidden"
        >
          <div className="p-4 pr-10 relative">
            <button
              type="button"
              onClick={dismiss}
              className="absolute top-3 right-3 w-6 h-6 rounded-md flex items-center justify-center text-[var(--color-text-dim)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
                <MessageSquarePlus className="w-4 h-4 text-[var(--color-accent)]" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-[var(--color-accent)]">
                New
              </p>
            </div>

            <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-text-primary)] mb-1">
              Got feedback? Send it our way.
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-3">
              Found a bug, have an idea, or got stuck? A real human reads every
              message. Find it under <strong>Feedback</strong> in the sidebar.
            </p>

            <div className="flex items-center gap-2">
              <Link
                href="/feedback"
                onClick={dismiss}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] px-3 py-1.5 rounded-md transition-colors"
              >
                Take me there
              </Link>
              <button
                type="button"
                onClick={dismiss}
                className="text-xs font-medium text-[var(--color-text-dim)] hover:text-[var(--color-text-primary)] px-2 py-1.5"
              >
                Got it
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
