"use client";

import { useEffect } from "react";

export function useSmoothScroll() {
  useEffect(() => {
    let raf: number;
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

      function loop(time: number) {
        lenis.raf(time);
        raf = requestAnimationFrame(loop);
      }
      raf = requestAnimationFrame(loop);
    }

    init();

    return () => {
      cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, []);
}
