"use client";

import { motion } from "framer-motion";

/**
 * Snappier per-page transition for authed app pages.
 * Marketing pages use the root /app/template.tsx which has a longer, more dramatic transition.
 * App pages prioritize speed since users navigate frequently.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
