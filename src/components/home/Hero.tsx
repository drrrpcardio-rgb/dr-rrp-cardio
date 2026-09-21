"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { brand, founder } from "@/lib/site-data";

const headline = "Learn. Understand. Apply.";

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

export function Hero() {
  const pathRef = useRef<SVGPathElement>(null);
  const pulseRef = useRef<SVGPathElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const path = pathRef.current;
    const pulse = pulseRef.current;
    if (!path) return;

    const length = path.getTotalLength();

    if (reduced) {
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: 0 });
      if (pulse) gsap.set(pulse, { opacity: 0.5 });
      return;
    }

    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    const tl = gsap.timeline({ delay: 0.4 });
    tl.to(path, { strokeDashoffset: 0, duration: 2.1, ease: "power2.inOut" });

    if (pulse) {
      const pulseLength = pulse.getTotalLength();
      gsap.set(pulse, { strokeDasharray: pulseLength, strokeDashoffset: pulseLength, opacity: 1 });
      tl.to(
        pulse,
        {
          strokeDashoffset: 0,
          duration: 1.6,
          ease: "power1.inOut",
          repeat: -1,
          repeatDelay: 0.8,
        },
        "-=0.3",
      );
    }

    return () => {
      tl.kill();
    };
  }, [reduced]);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-royal-50 via-white to-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-40 h-[560px] w-[560px] rounded-full bg-royal-100/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-40 -left-32 h-[420px] w-[420px] rounded-full bg-gold-100/50 blur-3xl"
      />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-5 pt-40 pb-24 text-center sm:px-8 sm:pt-48 sm:pb-32">
        <motion.div initial="hidden" animate="visible" variants={container} className="max-w-3xl">
          <motion.span
            variants={item}
            className="mb-5 inline-block rounded-full border border-royal-200 bg-white/70 px-4 py-1.5 text-xs font-semibold tracking-[0.16em] text-royal-700 uppercase backdrop-blur"
          >
            {brand.name}
          </motion.span>

          <motion.h1 className="font-heading text-4xl leading-[1.08] font-semibold text-ink sm:text-6xl">
            {headline.split(" ").map((word, i) => (
              <motion.span key={word + i} variants={item} className="mr-3 inline-block last:mr-0">
                {word}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p variants={item} className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-mist-700">
            Structured, practical cardiology education for doctors, postgraduates,
            nurses, and cath lab &amp; echo technicians.
          </motion.p>

          <motion.p variants={item} className="mt-3 text-sm font-medium tracking-wide text-royal-700">
            Founded &amp; Led by {founder.name}
          </motion.p>

          <motion.div variants={item} className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button href="/courses" size="lg" icon={<ArrowRight size={18} />}>
              Explore Courses
            </Button>
            <Button href="/free-learning" variant="secondary" size="lg" icon={<PlayCircle size={18} />}>
              Watch Free Lessons
            </Button>
          </motion.div>
        </motion.div>

        <div className="mt-16 w-full max-w-3xl sm:mt-20">
          <svg viewBox="0 0 800 200" className="w-full" aria-hidden="true">
            <path
              ref={pathRef}
              d="M0 100 L150 100 L185 30 L235 170 L275 60 L305 130 L340 100 L800 100"
              fill="none"
              stroke="var(--color-royal-700)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              ref={pulseRef}
              d="M0 100 L150 100 L185 30 L235 170 L275 60 L305 130 L340 100 L800 100"
              fill="none"
              stroke="var(--color-gold-400)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
