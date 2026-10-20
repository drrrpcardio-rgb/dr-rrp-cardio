"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

/**
 * Route-change transition: a quick upward slide into place. It deliberately has no opacity change and
 * no exit animation. Fading (or waiting for the old page to fade out) left the screen blank or dimmed on
 * every navigation, and for good if the browser paused animation frames (background tab, slow device).
 * Framer Motion's reducedMotion="user" (set on the root MotionConfig) strips the transform for
 * prefers-reduced-motion users, so they get no transition at all.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ y: 10 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
