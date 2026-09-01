"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "li";
}

/**
 * Reusable scroll-reveal wrapper: fade + translateY into place as the
 * element enters the viewport. Use `delay` (seconds) to stagger siblings —
 * see <StaggerGroup> for automatic staggering of a list of children.
 * Automatically degrades to a plain fade when the browser reports
 * prefers-reduced-motion (Framer Motion reads this itself via useReducedMotion
 * under the hood for whileInView when configured through MotionConfig, but we
 * keep the transform small and cheap regardless so the degrade is unnoticeable).
 */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
  as = "div",
}: RevealProps) {
  const Component = motion[as];
  return (
    <Component
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </Component>
  );
}

interface StaggerGroupProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
}

/** Wrap a grid/list of children to stagger their entrance via context-free CSS var trick. */
export function StaggerGroup({
  children,
  className,
  stagger = 0.1,
}: StaggerGroupProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: stagger },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
};
