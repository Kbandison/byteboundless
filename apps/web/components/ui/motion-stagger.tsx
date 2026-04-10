"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import {
  containerStagger,
  containerStaggerTight,
  staggerItem,
  rowItem,
} from "@/lib/motion";

type DivMotionProps = Omit<HTMLMotionProps<"div">, "variants" | "initial" | "animate">;

interface StaggerContainerProps extends DivMotionProps {
  /** Use tight stagger (~20ms) for table rows; default is normal (~50ms). */
  tight?: boolean;
}

/**
 * Wrap a list/grid with this to make its direct StaggerItem children fade
 * up in sequence on mount. Use sparingly — best on the most visible lists
 * (recent activity, dashboard cards, search results).
 */
export function StaggerContainer({ tight, children, ...rest }: StaggerContainerProps) {
  return (
    <motion.div
      variants={tight ? containerStaggerTight : containerStagger}
      initial="hidden"
      animate="visible"
      {...rest}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps extends DivMotionProps {
  /** Use the smaller `rowItem` variant for table rows. */
  row?: boolean;
}

export function StaggerItem({ row, children, ...rest }: StaggerItemProps) {
  return (
    <motion.div variants={row ? rowItem : staggerItem} {...rest}>
      {children}
    </motion.div>
  );
}
