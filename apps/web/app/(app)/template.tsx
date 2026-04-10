"use client";

import { motion } from "framer-motion";
import { pageEnter } from "@/lib/motion";

/**
 * Per-page transition for authed app pages. Re-runs on every navigation
 * because templates create a new instance per route change. Marketing
 * pages use the root /app/template.tsx with a more dramatic fade.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={pageEnter} initial="hidden" animate="visible">
      {children}
    </motion.div>
  );
}
