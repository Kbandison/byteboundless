"use client";

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => {
        // Once the template fade completes the layout is stable. Tell GSAP
        // to recalculate scroll trigger positions so sections below the fold
        // animate at the right scroll offset.
        if (typeof window !== "undefined") {
          import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
            ScrollTrigger.refresh();
          });
        }
      }}
    >
      {children}
    </motion.div>
  );
}
