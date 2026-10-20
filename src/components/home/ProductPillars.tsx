"use client";

import Link from "next/link";
import { ArrowRight, Activity, GraduationCap, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StaggerGroup, staggerItem } from "@/components/ui/Reveal";
import { ecgTool } from "@/lib/tools-data";

const pillars = [
  {
    icon: GraduationCap,
    tag: "Courses",
    title: "Structured cardiology courses",
    text: "ECG, Echo, Cath Lab, IVUS and Interventional Cardiology, taught live and recorded.",
    cta: "Explore courses",
    href: "/courses",
    accent: "from-royal-600 to-royal-800",
  },
  {
    icon: Activity,
    tag: "Free simulator",
    title: ecgTool.title,
    text: ecgTool.text,
    cta: "Open the simulator",
    href: ecgTool.href,
    accent: "from-emerald-600 to-teal-800",
  },
  {
    icon: Heart,
    tag: "Free simulator",
    title: "Cath Lab",
    text: "Virtual coronary angiography, 141 devices and 29 step-by-step procedures.",
    cta: "Open the Cath Lab",
    href: "/cath-lab",
    accent: "from-amber-500 to-orange-700",
  },
];

export function ProductPillars() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
      <SectionHeading
        eyebrow="What we offer"
        title="Learn it. Then practise it."
        description="Courses for the theory, simulators for the practice. Start wherever you like."
      />
      <StaggerGroup className="mt-12 grid gap-6 md:grid-cols-3">
        {pillars.map(({ icon: Icon, ...p }) => (
          <motion.div key={p.title} variants={staggerItem}>
            <Link
              href={p.href}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-mist-200 bg-white transition-shadow hover:shadow-xl"
            >
              <div className={`bg-gradient-to-br ${p.accent} p-7 text-white`}>
                <Icon size={30} strokeWidth={1.6} />
                <p className="mt-5 text-xs font-semibold tracking-widest text-white/75 uppercase">{p.tag}</p>
              </div>
              <div className="flex flex-1 flex-col p-7">
                <h3 className="font-heading text-xl font-semibold text-ink">{p.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-mist-700">{p.text}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-royal-700">
                  {p.cta}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </StaggerGroup>
    </section>
  );
}
