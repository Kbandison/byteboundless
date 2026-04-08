"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function useSmoothScroll() {
  useEffect(() => {
    let lenis: import("lenis").default;

    async function init() {
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;
      if (isTouchDevice || window.innerWidth < 768) return;

      const Lenis = (await import("lenis")).default;
      lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        smoothWheel: true,
      });

      // Sync Lenis scroll with GSAP ScrollTrigger
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }

    // Refresh ScrollTrigger on resize
    function onResize() {
      ScrollTrigger.refresh();
    }
    window.addEventListener("resize", onResize);

    init();

    return () => {
      window.removeEventListener("resize", onResize);
      lenis?.destroy();
    };
  }, []);
}
