"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Calculator,
  Check,
  HeartPulse,
  Waves,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Reveal, StaggerGroup, staggerItem } from "@/components/ui/Reveal";
import { simulators } from "@/lib/tools-data";

const ICONS = {
  echo: Waves,
  ecg: Activity,
  cath: HeartPulse,
  calc: Calculator,
};

/** Home page: the free simulation lab, with the echo simulator featured. */
export function SimulationLab() {
  const [echo, ...rest] = simulators;
  return (
    <section className="bg-royal-950 relative overflow-hidden py-20 text-white sm:py-24">
      <div
        aria-hidden="true"
        className="bg-grid pointer-events-none absolute inset-0 opacity-30"
      />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          tone="dark"
          eyebrow="Free simulation lab"
          title="Learn it. Then practise it."
          description="Courses give you the theory. The simulators let you practise echo, ECG and cath lab skills before you meet a patient, free in your browser."
        />

        {/* Featured: echo simulator */}
        <Reveal className="mt-12">
          <div className="grid overflow-hidden rounded-3xl border border-white/10 bg-white/5 lg:grid-cols-[1.25fr_1fr]">
            <Link
              href={echo.href}
              className="group relative block aspect-[800/654] overflow-hidden bg-black lg:aspect-auto lg:min-h-[420px]"
            >
              <Image
                src={echo.image}
                alt="The echo simulator: a probe on a 3D chest with the heart and great vessels"
                fill
                sizes="(max-width: 1024px) 100vw, 680px"
                className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute bottom-4 left-4 w-[38%] overflow-hidden rounded-xl border border-white/20 shadow-2xl">
                <Image
                  src="/images/echo-sim-a4c.jpg"
                  alt="Simulated apical four-chamber echo image"
                  width={786}
                  height={654}
                  className="block h-auto w-full"
                />
              </div>
            </Link>
            <div className="flex flex-col justify-center p-7 sm:p-10">
              <span className="bg-gold-400 text-royal-950 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase">
                <Waves size={14} aria-hidden="true" /> {echo.tag}
              </span>
              <h3 className="font-heading mt-4 text-3xl font-semibold sm:text-4xl">
                {echo.title}
              </h3>
              <p className="text-royal-100 mt-3 leading-relaxed">{echo.text}</p>
              <ul className="text-royal-50 mt-5 space-y-2 text-sm">
                {echo.points.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <Check
                      size={16}
                      className="text-gold-400"
                      aria-hidden="true"
                    />{" "}
                    {p}
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  href={echo.href}
                  variant="gold"
                  size="lg"
                  icon={<ArrowRight size={18} />}
                >
                  Start scanning
                </Button>
                <Button
                  href="/courses/echo"
                  variant="ghost"
                  size="lg"
                  className="border border-white/30 text-white hover:bg-white/10"
                >
                  Echo course
                </Button>
              </div>
            </div>
          </div>
        </Reveal>

        {/* The other tools */}
        <StaggerGroup className="mt-6 grid gap-6 md:grid-cols-3">
          {rest.map((t) => {
            const Icon = ICONS[t.id];
            return (
              <motion.div key={t.id} variants={staggerItem}>
                <Link
                  href={t.href}
                  className="group hover:border-gold-400/60 flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
                >
                  <div className="bg-royal-900 relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={t.image}
                      alt={`${t.title} screenshot`}
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-7">
                    <div className="flex items-center justify-between">
                      <span className="text-gold-300 flex size-11 items-center justify-center rounded-xl bg-white/10">
                        <Icon size={22} aria-hidden="true" />
                      </span>
                      <span className="text-royal-200 text-xs font-semibold tracking-widest uppercase">
                        {t.tag}
                      </span>
                    </div>
                    <h3 className="font-heading mt-5 text-xl font-semibold">
                      {t.title}
                    </h3>
                    <p className="text-royal-100 mt-2 flex-1 text-sm leading-relaxed">
                      {t.text}
                    </p>
                    <span className="text-gold-300 mt-5 inline-flex items-center gap-2 text-sm font-semibold">
                      Open
                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </StaggerGroup>

        <div className="mt-10 text-center">
          <Link
            href="/simulators"
            className="text-gold-300 inline-flex items-center gap-2 text-sm font-semibold hover:underline"
          >
            See all simulators and tools{" "}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
