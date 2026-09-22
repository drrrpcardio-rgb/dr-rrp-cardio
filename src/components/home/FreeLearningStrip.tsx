"use client";

import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StaggerGroup, staggerItem } from "@/components/ui/Reveal";
import { VideoCard } from "@/components/video/VideoCard";
import { Button } from "@/components/ui/Button";
import { freeVideos } from "@/lib/video-data";
import { motion } from "framer-motion";

export function FreeLearningStrip() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          eyebrow="Free Learning"
          title="Start on YouTube, go deeper in the academy"
          description="Free lessons that build real understanding — and lead naturally into the structured courses."
        />
        <Button href="/free-learning" variant="secondary" icon={<ArrowRight size={16} />}>
          All free videos
        </Button>
      </div>

      <StaggerGroup className="mt-12 grid gap-6 sm:grid-cols-2">
        {/* Teaser strip stays a 2-up grid — the full list is on /free-learning. */}
        {freeVideos.slice(0, 2).map((video) => (
          <motion.div key={video.id} variants={staggerItem}>
            <VideoCard video={video} />
          </motion.div>
        ))}
      </StaggerGroup>
    </section>
  );
}
