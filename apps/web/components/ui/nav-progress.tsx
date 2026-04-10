"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

/**
 * Lightweight navigation progress bar. Shows a thin accent-colored bar at
 * the top of the viewport whenever the pathname changes. Doesn't reflect
 * real load progress (Next.js doesn't expose navigation events) — it's a
 * feedback animation that makes navigation feel responsive.
 *
 * Pattern: store the latest pathname that triggered a navigation in state.
 * Use it as the React key on the motion.div so a fresh instance mounts on
 * each navigation, replaying the entry animation. First mount is skipped
 * via a ref so the bar doesn't flash on initial page load.
 */
export function NavProgress() {
  const pathname = usePathname();
  const isFirstRef = useRef(true);
  const [animKey, setAnimKey] = useState<string | null>(null);

  useEffect(() => {
    if (isFirstRef.current) {
      isFirstRef.current = false;
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnimKey(pathname);
  }, [pathname]);

  if (animKey === null) return null;

  return (
    <motion.div
      key={animKey}
      className="fixed top-0 left-0 right-0 z-[100] h-[2px] bg-[var(--color-accent)] origin-left pointer-events-none"
      initial={{ scaleX: 0, opacity: 1 }}
      animate={{ scaleX: 1, opacity: [1, 1, 0] }}
      transition={{
        scaleX: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
        opacity: { duration: 0.6, times: [0, 0.75, 1] },
      }}
    />
  );
}
