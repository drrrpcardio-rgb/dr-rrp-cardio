"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Calculator,
  HeartPulse,
  ScanHeart,
  Waves,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StaggerGroup, staggerItem } from "@/components/ui/Reveal";
import { simulators } from "@/lib/tools-data";

const ICONS = {
  echo: Waves,
  ct: ScanHeart,
  ecg: Activity,
  cath: HeartPulse,
  calc: Calculator,
};

/** Home page: the free simulation lab, all tools as equal cards. */
export function SimulationLab() {
  
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
          accent="practise"
          description="Courses give you the theory. The simulators let you practise echo, cardiac CT, ECG and cath lab skills before you meet a patient, free in your browser."
        />

        {/* The other tools */}
        <StaggerGroup className="mt-12 grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {simulators.map((t) => {
            const Icon = ICONS[t.id];
            return (
              <motion.div key={t.id} variants={staggerItem}>
                <Link
                  href={t.href}
                  className="spotlight spotlight-dark group hover:border-gold-400/60 flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-[background-color,border-color,transform] duration-300 hover:-translate-y-1 hover:bg-white/10"
                >
                  <div className="bg-royal-900 relative aspect-[16/10] overflow-hidden">
                    {"image" in t ? (
                      <Image
                        src={t.image}
                        alt={`${t.title} screenshot`}
                        fill
                        sizes="(max-width: 768px) 100vw, 400px"
                        className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="from-royal-800 via-royal-900 to-royal-950 flex h-full items-center justify-center bg-gradient-to-br">
                        <Icon size={56} className="text-gold-400/80" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
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
