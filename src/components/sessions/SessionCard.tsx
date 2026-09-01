"use client";

import { motion } from "framer-motion";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { SessionData, isUpcoming } from "@/lib/sessions-data";
import { staggerItem } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

export function SessionCard({ session, className }: { session: SessionData; className?: string }) {
  const upcoming = isUpcoming(session);

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ scale: 0.99 }}
      className={cn(
        "flex h-full w-full flex-col rounded-2xl border border-mist-200 bg-white p-6 shadow-sm",
        className,
      )}
    >
      <span
        className={cn(
          "mb-3 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase",
          upcoming ? "bg-gold-100 text-gold-700" : "bg-mist-100 text-mist-700",
        )}
      >
        {upcoming ? "Upcoming" : "Recently Held"}
      </span>

      <p className="text-xs font-semibold tracking-wide text-royal-700 uppercase">
        {session.courseName}
      </p>
      <h3 className="mt-1.5 font-heading text-lg leading-snug font-semibold text-ink">
        {session.title}
      </h3>

      <div className="mt-4 space-y-2 text-sm text-mist-700">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="shrink-0 text-royal-700" />
          {session.displayDate}
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} className="shrink-0 text-royal-700" />
          {session.time}
        </div>
        {session.venue && (
          <div className="flex items-center gap-2">
            <MapPin size={16} className="shrink-0 text-royal-700" />
            {session.venue}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {session.audience.map((a) => (
          <span
            key={a}
            className="rounded-full bg-royal-50 px-2.5 py-1 text-[0.7rem] font-medium text-royal-700"
          >
            {a}
          </span>
        ))}
      </div>

      <p className="mt-4 flex-1 text-sm leading-relaxed text-mist-700">{session.objective}</p>
    </motion.div>
  );
}
