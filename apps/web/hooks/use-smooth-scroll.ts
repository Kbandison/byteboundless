"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function useSmoothScroll() {
  useEffect(() => {
    let lenis: import("lenis").default | undefined;
    let cancelled = false;
    let tickerCb: ((time: number) => void) | null = null;
    let scrollListenerAttached = false;

    async function init() {
      // Lenis only on non-touch desktop. Touch + mobile use native scroll
      // (which works fine with ScrollTrigger out of the box).
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;
      if (isTouchDevice || window.innerWidth < 768) return;

      const Lenis = (await import("lenis")).default;
      if (cancelled) return;

      lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        smoothWheel: true,
      });

      // Sync Lenis scroll events with ScrollTrigger so triggers fire at the
      // correct positions even though Lenis intercepts wheel events.
      lenis.on("scroll", ScrollTrigger.update);
      scrollListenerAttached = true;

      // Drive Lenis from GSAP's ticker so animations and scroll stay
      // perfectly in sync (no double-RAF jitter).
      tickerCb = (time: number) => {
        lenis?.raf(time * 1000);
      };
      gsap.ticker.add(tickerCb);
      gsap.ticker.lagSmoothing(0);

      // CRITICAL: refresh ScrollTrigger AFTER Lenis is hooked up so triggers
      // recalculate positions against Lenis-controlled scroll. Without this,
      // triggers registered before Lenis init are stale.
      ScrollTrigger.refresh();
    }

    function onResize() {
      ScrollTrigger.refresh();
    }
    window.addEventListener("resize", onResize);

    init();

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      if (tickerCb) gsap.ticker.remove(tickerCb);
      if (lenis && scrollListenerAttached) {
        lenis.off("scroll", ScrollTrigger.update);
      }
      lenis?.destroy();
    };
  }, []);
}
