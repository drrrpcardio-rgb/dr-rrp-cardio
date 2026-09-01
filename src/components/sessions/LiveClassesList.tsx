"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { StaggerGroup } from "@/components/ui/Reveal";
import { SessionCard } from "@/components/sessions/SessionCard";
import { allSessions, SessionMode } from "@/lib/sessions-data";
import { cn } from "@/lib/utils";

const tabs: { label: string; value: SessionMode | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Online", value: "online" },
  { label: "Offline", value: "offline" },
];

export function LiveClassesList() {
  const [active, setActive] = useState<SessionMode | "all">("all");

  const filtered =
    active === "all" ? allSessions : allSessions.filter((s) => s.mode === active);

  return (
    <div>
      <div className="mb-10 inline-flex rounded-full border border-mist-200 bg-mist-50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActive(tab.value)}
            className={cn(
              "relative rounded-full px-5 py-2 text-sm font-medium transition-colors",
              active === tab.value ? "text-white" : "text-mist-700 hover:text-royal-700",
            )}
          >
            {active === tab.value && (
              <motion.span
                layoutId="live-classes-tab"
                className="absolute inset-0 rounded-full bg-royal-700"
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </StaggerGroup>
      ) : (
        <p className="rounded-2xl border border-dashed border-mist-300 bg-mist-50 p-10 text-center text-sm text-mist-600">
          No {active} sessions scheduled right now — check back soon.
        </p>
      )}
    </div>
  );
}
