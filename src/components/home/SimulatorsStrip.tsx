"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StaggerGroup, staggerItem } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { ecgTool } from "@/lib/tools-data";

export function SimulatorsStrip() {
  const cards = [
    { title: ecgTool.title, text: ecgTool.text, cta: "Open ECG Mastery", href: ecgTool.href },
    {
      title: "Cath Lab",
      text: "A virtual coronary angiography simulator, a library of 134 cath lab devices and step-by-step overviews of 29 procedures.",
      cta: "Open the Cath Lab",
      href: "/cath-lab",
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
      <SectionHeading
        eyebrow="Free tools"
        title="Practise with the simulators"
        description="Interactive tools for trainees, nurses, technologists and doctors. Free to use, in your browser."
      />
      <StaggerGroup className="mt-12 grid gap-6 sm:grid-cols-2">
        {cards.map((c) => (
          <motion.div
            key={c.title}
            variants={staggerItem}
            className="flex flex-col rounded-2xl border border-royal-100 bg-white p-8"
          >
            <h3 className="font-heading text-xl font-semibold text-ink">{c.title}</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-mist-700">{c.text}</p>
            <div className="mt-6">
              <Button href={c.href} variant="secondary" icon={<ArrowRight size={16} />}>
                {c.cta}
              </Button>
            </div>
          </motion.div>
        ))}
      </StaggerGroup>
    </section>
  );
}
