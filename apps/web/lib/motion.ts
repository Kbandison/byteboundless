import type { Variants, Transition } from "framer-motion";

/**
 * Reusable Framer Motion variants + transitions for the (app) side.
 * Keeps animation behavior consistent across pages and lets us tune the
 * "feel" of the app from one place.
 *
 * Design rules:
 * - All easings use the ease-out-expo curve [0.22, 1, 0.36, 1] which feels
 *   native (deceleration matches iOS/macOS system animations).
 * - Distances are small (4-12px) — app pages need to feel responsive, not
 *   theatrical. Marketing pages get the bigger movements.
 * - Stagger between siblings is short (40-60ms) so loaded lists feel smooth
 *   without dragging.
 */

export const EASE_OUT_EXPO: Transition["ease"] = [0.22, 1, 0.36, 1];

/** Standard transition for app entry animations. */
export const APP_TRANSITION: Transition = {
  duration: 0.35,
  ease: EASE_OUT_EXPO,
};

/** Snappier variant for hover/tap micro-interactions. */
export const SNAPPY_TRANSITION: Transition = {
  duration: 0.18,
  ease: EASE_OUT_EXPO,
};

/**
 * Page-level entry: fade + small slide up. Used by (app)/template.tsx.
 * Slightly longer than a hover so it feels intentional.
 */
export const pageEnter: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: EASE_OUT_EXPO },
  },
};

/**
 * Container that staggers its direct children. Use with `containerStagger`
 * + `staggerItem` to make a list/grid feel like it's being placed, not popped.
 */
export const containerStagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.04,
    },
  },
};

/** A single item inside a `containerStagger`. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: EASE_OUT_EXPO },
  },
};

/** Tighter stagger for table rows / dense lists. */
export const containerStaggerTight: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.02,
      delayChildren: 0.02,
    },
  },
};

/** Use for table row entry — even smaller travel distance. */
export const rowItem: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: EASE_OUT_EXPO },
  },
};

/**
 * Modal / overlay scale-in. Use with AnimatePresence so the exit also plays.
 * Slight scale + fade gives a "drop in" feel without being disruptive.
 */
export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: -8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.22, ease: EASE_OUT_EXPO },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: -8,
    transition: { duration: 0.15, ease: EASE_OUT_EXPO },
  },
};

/** Backdrop fade, paired with modalContent. */
export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/**
 * Hover lift for interactive cards. Apply via `whileHover` on a `motion.div`.
 * Subtle — just 1px translate and a slight scale.
 */
export const HOVER_LIFT = {
  y: -2,
  transition: SNAPPY_TRANSITION,
};

/** Tap feedback — small scale-down for buttons. */
export const TAP_PRESS = {
  scale: 0.97,
  transition: { duration: 0.08 },
};
