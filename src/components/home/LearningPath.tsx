"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useSpring } from "framer-motion";
import { ArrowUpRight, BookOpen, Lightbulb, Stethoscope } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";

const steps = [
  {
    icon: BookOpen,
    word: "Learn",
    title: "Start from first principles",
    text: "Short structured modules build the mechanism behind every waveform, window and angiographic view, so nothing has to be memorised blindly.",
    link: { label: "Browse courses", href: "/courses" },
  },
  {
    icon: Lightbulb,
    word: "Understand",
    title: "Practise until it clicks",
    text: "Scan a 3D heart, read live 12-lead rhythms and rehearse cath lab views in free simulators, then check yourself with quizzes and cheat sheets.",
    link: { label: "Open the simulators", href: "/simulators" },
  },
  {
    icon: Stethoscope,
    word: "Apply",
    title: "Use it on real cases",
    text: "Live classes, case discussions and case files from the cath lab show the same system working on real patients, where it matters.",
    link: { label: "Read the case files", href: "/blog" },
  },
];

/** The teaching method as three steps joined by a line that fills in as the section scrolls past. */
export function LearningPath() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  return (
    <section className="relative bg-white">
      <div className="mx-auto max-w-7xl px-5 pt-24 pb-20 sm:px-8 sm:pt-28">
        <SectionHeading
          align="center"
          eyebrow="The method"
          title="Learn. Understand. Apply."
          accent="Apply."
          description="We teach cardiology the way it is practised: one waveform, one window, one case at a time, so what you learn carries straight to the bedside, the echo lab and the cath lab."
        />

        <div ref={ref} className="relative mt-16">
          {/* Connecting line: vertical on phones, horizontal from lg up */}
          <div aria-hidden="true" className="absolute top-0 bottom-0 left-7 w-px bg-mist-200 lg:top-7 lg:right-[16%] lg:bottom-auto lg:left-[16%] lg:h-px lg:w-auto" />
          <motion.div
            aria-hidden="true"
            style={{ scaleY: fill }}
            className="absolute top-0 bottom-0 left-7 w-px origin-top bg-gold-400 lg:hidden"
          />
          <motion.div
            aria-hidden="true"
            style={{ scaleX: fill }}
            className="absolute top-7 right-[16%] left-[16%] hidden h-px origin-left bg-gold-400 lg:block"
          />

          <ol className="relative grid gap-12 lg:grid-cols-3 lg:gap-10">
            {steps.map(({ icon: Icon, ...s }, i) => (
              <motion.li
                key={s.word}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex gap-6 lg:flex-col lg:items-center lg:text-center"
              >
                <span className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-2xl bg-royal-900 text-gold-300 shadow-lg shadow-royal-900/20 ring-8 ring-white">
                  <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-bold tracking-[0.2em] text-gold-600 uppercase">
                    0{i + 1} · {s.word}
                  </p>
                  <h3 className="mt-2 font-heading text-2xl font-semibold text-ink">{s.title}</h3>
                  <p className="mt-3 max-w-sm text-[0.95rem] leading-relaxed text-mist-700 lg:mx-auto">{s.text}</p>
                  <Link href={s.link.href} className="group mt-4 inline-flex items-center gap-1 text-sm font-semibold text-royal-700">
                    <span className="underline-grow">{s.link.label}</span>
                    <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                  </Link>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
