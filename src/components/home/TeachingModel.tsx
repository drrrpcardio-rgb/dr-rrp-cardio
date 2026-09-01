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
    <section className="bg-mist-50 py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="How you learn"
          title="A teaching model built around application"
          description="Every format feeds into the same goal: interpretation you can trust in the moment it matters."
        />

        <StaggerGroup className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-4">
          {items.map(({ icon: Icon, label, description }) => (
            <motion.div
              key={label}
              variants={staggerItem}
              className="group rounded-xl border border-mist-200 bg-white p-6 text-center transition-shadow hover:shadow-md"
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-royal-50 text-royal-700 transition-transform duration-300 group-hover:scale-110"
              >
                <Icon size={22} strokeWidth={1.75} />
              </motion.div>
              <h3 className="mt-4 text-sm font-semibold text-ink">{label}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-mist-700">{description}</p>
            </motion.div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
