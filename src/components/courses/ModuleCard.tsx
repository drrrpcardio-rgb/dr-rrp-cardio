"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock3, Radio, Hammer, CalendarDays } from "lucide-react";
import Link from "next/link";
import { CourseModule } from "@/lib/courses-data";
import { Button } from "@/components/ui/Button";
import { staggerItem } from "@/components/ui/Reveal";

export function ModuleCard({ module: mod }: { module: CourseModule }) {
  const closed = mod.enrollmentStatus === "closed";
  const curriculumPlanned = Boolean(mod.format && mod.duration);

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col gap-5 rounded-2xl border border-mist-200 bg-white p-7 shadow-sm transition-shadow hover:shadow-lg sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        {closed && (
          <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-mist-100 px-2.5 py-1 text-xs font-semibold text-mist-700">
            <CheckCircle2 size={13} /> Completed
          </span>
        )}
        <h3 className="font-heading text-xl font-semibold text-ink">{mod.name}</h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist-700">{mod.description}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-mist-600">
          {curriculumPlanned ? (
            <>
              <span className="inline-flex items-center gap-1.5">
                <Radio size={14} className="text-royal-700" /> {mod.format}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 size={14} className="text-royal-700" /> {mod.duration}
              </span>
            </>
          ) : (
            !closed && (
              <span className="inline-flex items-center gap-1.5">
                <Hammer size={14} className="text-royal-700" /> Curriculum in development
              </span>
            )
          )}
        </div>
        {mod.nextLiveBatchNote && (
          <Link
            href="/live-classes"
            className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-700 transition-colors hover:bg-gold-200"
          >
            <CalendarDays size={13} /> {mod.nextLiveBatchNote}
          </Link>
        )}
      </div>
      {closed ? (
        <span className="shrink-0 text-sm font-medium text-mist-600">
          Not currently enrolling
        </span>
      ) : (
        <Button href="/contact" size="md" className="shrink-0">
          Enquire Now
        </Button>
      )}
    </motion.div>
  );
}
