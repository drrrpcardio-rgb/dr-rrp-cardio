"use client";

import { motion } from "framer-motion";
import { staggerItem } from "@/components/ui/Reveal";
import { VideoCard } from "@/components/video/VideoCard";
import { VideoEntry } from "@/lib/video-data";

export function VideoGridItem({ video }: { video: VideoEntry }) {
  return (
    <motion.div variants={staggerItem}>
      <VideoCard video={video} />
    </motion.div>
  );
}
