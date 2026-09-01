"use client";

import { MotionConfig } from "framer-motion";
import { ReactNode } from "react";

/** reducedMotion="user" makes every Framer Motion animation in the tree
 * automatically drop transforms (keeping opacity fades) for users with
 * prefers-reduced-motion enabled, without each component branching on it. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
