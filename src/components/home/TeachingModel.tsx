"use client";

import { motion } from "framer-motion";
import {
  Video,
  Radio,
  Users,
  Wrench,
  MessageSquare,
  PlaySquare,
  ClipboardCheck,
  Award,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StaggerGroup, staggerItem } from "@/components/ui/Reveal";

const items = [
  { icon: Video, label: "Recorded Courses", description: "Structured modules, watch anytime." },
  { icon: Radio, label: "Live Online Classes", description: "Real-time teaching, Q&A included." },
  { icon: Users, label: "Offline Classes", description: "In-person, classroom-style teaching sessions." },
  { icon: Wrench, label: "Hands-on Workshops", description: "Practical, case-driven skill building." },
  { icon: MessageSquare, label: "Case Discussions", description: "Real cases, discussed systematically." },
  { icon: PlaySquare, label: "YouTube Content", description: "Free lessons that lead into full courses." },
  { icon: ClipboardCheck, label: "Assessments", description: "Check understanding, not just attendance." },
  { icon: Award, label: "Certificates", description: "Completion and participation certificates." },
];

export function TeachingModel() {
  return (
    <section className="relative overflow-hidden bg-royal-950 py-28 text-white">
      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          tone="dark"
          eyebrow="How you learn"
          title="A teaching model built around application"
          description="Every format feeds into the same goal: interpretation you can trust in the moment it matters."
        />

        <StaggerGroup className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-4">
          {items.map(({ icon: Icon, label, description }) => (
            <motion.div
              key={label}
              variants={staggerItem}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur transition-colors hover:border-gold-400/60 hover:bg-white/10"
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold-400/15 text-gold-300 transition-transform duration-300 group-hover:scale-110"
              >
                <Icon size={22} strokeWidth={1.75} />
              </motion.div>
              <h3 className="mt-4 text-sm font-semibold text-white">{label}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-royal-200">{description}</p>
            </motion.div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
