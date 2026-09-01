"use client";

import { motion } from "framer-motion";
import { CalendarClock } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SessionCard } from "@/components/sessions/SessionCard";
import { StaggerGroup, staggerItem } from "@/components/ui/Reveal";
import { allSessions } from "@/lib/sessions-data";
import { Button } from "@/components/ui/Button";

export function UpcomingProgrammes() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          eyebrow="Live &amp; In-Person"
          title="Upcoming programmes"
          description="Live classes and hands-on workshops, listed as they're scheduled."
        />
        <Button href="/live-classes" variant="secondary">
          View all live classes
        </Button>
      </div>

      <StaggerGroup className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [-webkit-overflow-scrolling:touch]">
        {allSessions.map((session) => (
          <div key={session.id} className="w-[85vw] shrink-0 snap-start sm:w-[380px]">
            <SessionCard session={session} />
          </div>
        ))}

        <motion.div
          variants={staggerItem}
          className="flex w-[85vw] shrink-0 snap-start flex-col items-center justify-center rounded-2xl border border-dashed border-mist-300 bg-mist-50 p-8 text-center sm:w-[380px]"
        >
          <CalendarClock size={28} className="text-royal-700" strokeWidth={1.5} />
          <p className="mt-4 text-sm font-medium text-ink-soft">
            More live classes &amp; workshops being scheduled
          </p>
          <p className="mt-1 text-xs text-mist-600">Check back soon, or register your interest.</p>
        </motion.div>
      </StaggerGroup>
    </section>
  );
}
