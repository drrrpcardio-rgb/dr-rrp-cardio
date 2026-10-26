"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/** Cycles through words in place, each rolling up from below. Screen readers get the full list once. */
export function RotatingWord({ words, interval = 2400, className }: { words: string[]; interval?: number; className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [words.length, interval]);

  return (
    <span className={`relative inline-grid align-bottom ${className ?? ""}`}>
      <span className="sr-only">{words.join(", ")}</span>
      <span aria-hidden="true" className="relative inline-block overflow-hidden">
        {/* Invisible longest word keeps the width steady. */}
        <span className="invisible">{words.reduce((a, b) => (b.length > a.length ? b : a))}</span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={words[i]}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-0 whitespace-nowrap"
          >
            {words[i]}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}
