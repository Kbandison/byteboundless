# LuxWeb Module: Stack & Setup

> **Read when**: Starting a new project. Contains the full dependency stack, directory structure, and base file templates.

---

## Scaffold

```bash
npx create-next-app@latest [project-name] --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
cd [project-name]
```

## Dependencies

### Always Install (Every Project)

```bash
# Animation & scroll
npm install gsap @studio-freight/lenis framer-motion

# UI utilities
npm install clsx tailwind-merge class-variance-authority lucide-react sharp

# shadcn base
npx shadcn@latest init -d
```

### Install When MOTION_INTENSITY ≥ 7

```bash
# Already covered by gsap — just ensure ScrollTrigger, SplitText are registered
# No extra packages needed, these are GSAP plugins
```

### Install When Project Requires 3D

```bash
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing
npm install -D @types/three

# Optional: Spline for visual 3D scenes
npm install @splinetool/react-spline @splinetool/runtime

# Optional: Custom shaders
npm install glsl-noise lamina
```

### Install When Project Requires Global State (3D + HTML sync)

```bash
npm install zustand
```

---

## Directory Structure

### Standard Project (No 3D)

```
src/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Homepage
│   ├── not-found.tsx       # Custom 404 (MANDATORY)
│   └── globals.css → moved to styles/
├── components/
│   ├── ui/                 # Buttons, inputs, badges, magnetic elements
│   ├── sections/           # Hero, features, work, CTA, etc.
│   ├── layout/             # Navbar, footer, smooth scroll provider
│   └── animations/         # Reusable animation wrappers
├── hooks/
│   ├── use-smooth-scroll.ts
│   ├── use-gsap.ts
│   └── use-viewport.ts
├── lib/
│   ├── utils.ts            # cn() helper
│   └── constants.ts        # Site metadata, nav links, etc.
└── styles/
    └── globals.css
```

### 3D-Enhanced Project (Add These)

```
src/
├── components/
│   └── canvas/
│       ├── persistent-canvas.tsx  # Single R3F canvas, fixed behind HTML
│       ├── scenes/                # Scene controllers per section
│       ├── objects/               # 3D meshes, particles, geometries
│       ├── effects/               # Post-processing stack
│       └── materials/             # Custom shader materials
├── shaders/                       # Raw .vert / .frag GLSL files
├── store/
│   └── use-app-store.ts          # Zustand for scroll/mouse/scene state
└── hooks/
    ├── use-mouse-position.ts
    └── use-scroll-progress.ts
```

### Public Directory

```
public/
├── images/         # Optimized WebP/AVIF
├── videos/         # MP4 hero/background videos
├── fonts/          # Self-hosted fonts (if not Google Fonts)
├── models/         # .glb/.gltf (3D projects only)
└── textures/       # HDR, matcap, normal maps (3D projects only)
```

---

## Base Files (Create These on Every Project)

### `src/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### `src/lib/math.ts` (for MOTION_INTENSITY ≥ 5 or 3D projects)

```typescript
export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}
```

### `src/hooks/use-smooth-scroll.ts`

```typescript
"use client";

import { useEffect } from "react";
import Lenis from "@studio-freight/lenis";

export function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);
}
```

**If using Zustand (3D projects)**, also push scroll progress inside the Lenis callback:

```typescript
lenis.on("scroll", ({ progress }: { progress: number }) => {
  useAppStore.getState().setScrollProgress(progress);
});
```

### `src/hooks/use-gsap.ts`

```typescript
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useGSAP(
  callback: (gsap: typeof import("gsap").gsap) => void,
  deps: any[] = []
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      callback(gsap);
    }, ref);

    return () => ctx.revert();
  }, deps);

  return ref;
}

export { gsap, ScrollTrigger };
```

### `src/hooks/use-viewport.ts`

```typescript
"use client";

import { useState, useEffect } from "react";

export function useViewport() {
  const [viewport, setViewport] = useState({
    width: 0,
    height: 0,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  });

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      setViewport({
        width: w,
        height: window.innerHeight,
        isMobile: w < 768,
        isTablet: w >= 768 && w < 1024,
        isDesktop: w >= 1024,
      });
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return viewport;
}
```

### `src/components/layout/smooth-scroll-provider.tsx`

```typescript
"use client";

import { useSmoothScroll } from "@/hooks/use-smooth-scroll";

export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useSmoothScroll();
  return <>{children}</>;
}
```

### `src/styles/globals.css` (Template — customize per project)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ================================================
   PROJECT: [NAME]
   FONTS: [DISPLAY] + [BODY]
   Update the import URL and variable values per project.
   ================================================ */

@import url('https://fonts.googleapis.com/css2?family=[DISPLAY_FONT]:wght@500;700;900&family=[BODY_FONT]:wght@300;400;500&display=swap');

:root {
  --font-display: '[DISPLAY_FONT]', sans-serif;
  --font-body: '[BODY_FONT]', sans-serif;

  /* Colors — override per project */
  --bg-primary: #0A0A0A;
  --bg-secondary: #111111;
  --bg-tertiary: #1A1A1A;
  --text-primary: #E8E8E8;
  --text-secondary: #888888;
  --text-dim: #444444;
  --accent: #FF4D00;
  --accent-hover: #FF6B2B;
  --border: #1F1F1F;
  --glow: rgba(255, 77, 0, 0.12);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: auto; /* Lenis handles smooth scroll */
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 17px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  line-height: 1.05;
  letter-spacing: -0.03em;
  font-weight: 700;
}

::selection {
  background-color: var(--accent);
  color: var(--text-primary);
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--bg-primary); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-secondary); }

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Root Layout Pattern

```tsx
// src/app/layout.tsx
import { SmoothScrollProvider } from "@/components/layout/smooth-scroll-provider";
import "@/styles/globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
```

For 3D projects, add the persistent canvas and Zustand provider here (see `3D.md`).

---

## Tailwind Config Adjustments

Extend `tailwind.config.ts` with the project's design tokens:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      colors: {
        bg: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          tertiary: "var(--bg-tertiary)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          dim: "var(--text-dim)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
        },
        border: "var(--border)",
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## Performance Baseline

- Images: WebP/AVIF via Next.js `<Image>`, lazy-load below fold, `priority` on hero
- Fonts: `display=swap`, preload primary weight
- Animations: Only `transform` and `opacity` — GPU-accelerated
- Heavy components (3D, complex animations): `dynamic(() => import(...), { ssr: false })`
- Lighthouse target: 90+ performance score
- Bundle target: < 200KB JS initial load (excluding 3D assets)
