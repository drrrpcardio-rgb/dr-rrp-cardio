"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  tone?: "light" | "dark";
  /** Word(s) of the title to set in gold italic, e.g. "courses". */
  accent?: string;
}

const ease = [0.22, 1, 0.36, 1] as const;

/** Section title: the eyebrow's gold rule draws in, then the title rises word by word. */
export function SectionHeading({ eyebrow, title, description, align = "left", className, tone = "light", accent }: SectionHeadingProps) {
  const dark = tone === "dark";
  const accentWords = new Set(accent?.split(" ") ?? []);
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}
    >
      {eyebrow && (
        <motion.span
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.4 } } }}
          className={cn(
            "mb-4 inline-flex items-center gap-3 text-xs font-semibold tracking-[0.2em] uppercase",
            dark ? "text-gold-300" : "text-gold-700",
          )}
        >
          <motion.span
            aria-hidden="true"
            variants={{ hidden: { scaleX: 0 }, visible: { scaleX: 1, transition: { duration: 0.6, ease } } }}
            className="h-px w-8 origin-left bg-gold-400"
          />
          {eyebrow}
        </motion.span>
      )}
      <h2 className={cn("text-3xl leading-tight font-semibold sm:text-5xl", dark ? "text-white" : "text-ink")}>
        {title.split(" ").map((word, i) => (
          <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
            <motion.span
              className={cn("inline-block", accentWords.has(word) && (dark ? "text-gold-300 italic" : "text-gold-600 italic"))}
              variants={{ hidden: { y: "105%" }, visible: { y: 0, transition: { duration: 0.7, delay: 0.1 + i * 0.045, ease } } }}
            >
              {word}
              {i < title.split(" ").length - 1 && " "}
            </motion.span>
          </span>
        ))}
      </h2>
      {description && (
        <motion.p
          variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.3, ease } } }}
          className={cn("mt-4 text-base leading-relaxed sm:text-lg", dark ? "text-royal-100" : "text-mist-700")}
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  );
}
