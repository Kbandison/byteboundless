"use client";

import { usePathname } from "next/navigation";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";

// Routes where Lenis smooth scroll is enabled. These are the marketing /
// content pages where slow buttery scroll feels premium. Authed app routes
// (dashboard, lists, settings, etc.) use native scroll so the command palette,
// dropdowns, modals, and table scrolling all behave predictably.
const SMOOTH_SCROLL_PATHS = [
  "/", // landing
  "/how-it-works",
  "/pricing",
  "/privacy",
  "/terms",
];

function shouldEnableSmoothScroll(pathname: string): boolean {
  if (SMOOTH_SCROLL_PATHS.includes(pathname)) return true;
  // also enable for any nested marketing routes (e.g. /blog/foo if added)
  if (pathname.startsWith("/blog")) return true;
  return false;
}

function SmoothScrollGate() {
  // This component just calls the hook conditionally via early return.
  useSmoothScroll();
  return null;
}

export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const enabled = shouldEnableSmoothScroll(pathname);

  return (
    <>
      {enabled && <SmoothScrollGate />}
      {children}
    </>
  );
}
