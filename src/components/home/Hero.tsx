"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
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
    tl.to(path, { strokeDashoffset: 0, duration: 5.5, ease: "none" });

    if (pulse) {
      const pulseLength = pulse.getTotalLength();
      gsap.set(pulse, { strokeDasharray: pulseLength, strokeDashoffset: pulseLength, opacity: 1 });
      tl.to(
        pulse,
        {
          strokeDashoffset: 0,
          duration: 6,
          ease: "none",
          repeat: -1,
          repeatDelay: 1.5,
        },
        "-=0.3",
      );
    }

    return () => {
      tl.kill();
    };
  }, [reduced]);

  return (
    <section className="relative overflow-hidden bg-royal-950 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,var(--color-royal-700)_0%,transparent_55%),radial-gradient(ellipse_at_10%_90%,var(--color-royal-800)_0%,transparent_50%)] opacity-80"
      />
      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pt-36 pb-28 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:pt-44 lg:pb-36">
        <motion.div initial="hidden" animate="visible" variants={container}>
          <motion.span
            variants={item}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-[0.16em] text-gold-300 uppercase backdrop-blur"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
            {brand.name}
          </motion.span>

          <motion.h1 className="font-heading text-5xl leading-[1.02] font-semibold sm:text-7xl">
            {headline.split(" ").map((word, i) => (
              <motion.span
                key={word + i}
                variants={item}
                className={i === 2 ? "block text-gold-400" : "block"}
              >
                {word}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p variants={item} className="mt-7 max-w-xl text-lg leading-relaxed text-royal-100">
            Structured, practical cardiology education for doctors, postgraduates, nurses, and
            cath lab &amp; echo technicians.
          </motion.p>

          <motion.div variants={item} className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Button href="/courses" variant="gold" size="lg" icon={<ArrowRight size={18} />}>
              Explore Courses
            </Button>
            <Button
              href="/free-learning"
              variant="ghost"
              size="lg"
              className="border border-white/30 text-white hover:bg-white/10"
              icon={<PlayCircle size={18} />}
            >
              Watch Free Lessons
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-sm lg:max-w-none"
        >
          <div className="absolute -right-3 -bottom-3 h-full w-full rounded-3xl border-2 border-gold-400/70" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-royal-900 shadow-2xl shadow-black/40">
            <Image
              src="/images/founder-portrait-2.jpg"
              alt={`${founder.name}, ${founder.role}, ${brand.name}`}
              fill
              priority
              sizes="(max-width: 1024px) 90vw, 480px"
              className="object-cover object-top"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-royal-950/95 to-transparent p-6 pt-20">
              <p className="font-heading text-lg font-semibold">{founder.name}</p>
              <p className="mt-0.5 text-xs text-royal-100">
                {founder.title} &middot; {founder.credentials}
              </p>
              <p className="mt-1 text-[0.7rem] tracking-wide text-gold-300 uppercase">
                Founded &amp; Led by {founder.name}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <svg
        viewBox="0 0 1600 200"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full opacity-70 sm:h-32"
        aria-hidden="true"
      >
        <path
          ref={pathRef}
          d="M0 100 L20 100 c4 -14 24 -14 28 0 L62 100 L66 107 L76 18 L86 132 L92 100 L112 100 c10 -28 44 -28 54 0 L200 100 L220 100 c4 -14 24 -14 28 0 L262 100 L266 107 L276 18 L286 132 L292 100 L312 100 c10 -28 44 -28 54 0 L400 100 L420 100 c4 -14 24 -14 28 0 L462 100 L466 107 L476 18 L486 132 L492 100 L512 100 c10 -28 44 -28 54 0 L600 100 L620 100 c4 -14 24 -14 28 0 L662 100 L666 107 L676 18 L686 132 L692 100 L712 100 c10 -28 44 -28 54 0 L800 100 L820 100 c4 -14 24 -14 28 0 L862 100 L866 107 L876 18 L886 132 L892 100 L912 100 c10 -28 44 -28 54 0 L1000 100 L1020 100 c4 -14 24 -14 28 0 L1062 100 L1066 107 L1076 18 L1086 132 L1092 100 L1112 100 c10 -28 44 -28 54 0 L1200 100 L1220 100 c4 -14 24 -14 28 0 L1262 100 L1266 107 L1276 18 L1286 132 L1292 100 L1312 100 c10 -28 44 -28 54 0 L1400 100 L1420 100 c4 -14 24 -14 28 0 L1462 100 L1466 107 L1476 18 L1486 132 L1492 100 L1512 100 c10 -28 44 -28 54 0 L1600 100"
          fill="none"
          stroke="var(--color-gold-400)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          ref={pulseRef}
          d="M0 100 L20 100 c4 -14 24 -14 28 0 L62 100 L66 107 L76 18 L86 132 L92 100 L112 100 c10 -28 44 -28 54 0 L200 100 L220 100 c4 -14 24 -14 28 0 L262 100 L266 107 L276 18 L286 132 L292 100 L312 100 c10 -28 44 -28 54 0 L400 100 L420 100 c4 -14 24 -14 28 0 L462 100 L466 107 L476 18 L486 132 L492 100 L512 100 c10 -28 44 -28 54 0 L600 100 L620 100 c4 -14 24 -14 28 0 L662 100 L666 107 L676 18 L686 132 L692 100 L712 100 c10 -28 44 -28 54 0 L800 100 L820 100 c4 -14 24 -14 28 0 L862 100 L866 107 L876 18 L886 132 L892 100 L912 100 c10 -28 44 -28 54 0 L1000 100 L1020 100 c4 -14 24 -14 28 0 L1062 100 L1066 107 L1076 18 L1086 132 L1092 100 L1112 100 c10 -28 44 -28 54 0 L1200 100 L1220 100 c4 -14 24 -14 28 0 L1262 100 L1266 107 L1276 18 L1286 132 L1292 100 L1312 100 c10 -28 44 -28 54 0 L1400 100 L1420 100 c4 -14 24 -14 28 0 L1462 100 L1466 107 L1476 18 L1486 132 L1492 100 L1512 100 c10 -28 44 -28 54 0 L1600 100"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </section>
  );
}
