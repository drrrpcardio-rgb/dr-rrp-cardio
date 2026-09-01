"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { VideoEntry } from "@/lib/video-data";

/**
 * Lite YouTube embed facade: shows the thumbnail + a play button and only
 * swaps in the real iframe on click, so the page never pays for YouTube's
 * player bundle up front.
 */
export function VideoCard({ video }: { video: VideoEntry }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-mist-200 bg-white shadow-sm">
      <div className="relative aspect-video w-full overflow-hidden bg-ink">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1`}
            title={video.title}
            allow="accelerated-video-playback; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play: ${video.title}`}
            className="absolute inset-0 h-full w-full"
          >
            <Image
              src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 480px"
              className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-ink/25 transition-colors group-hover:bg-ink/35" />
            <motion.span
              whileHover={{ scale: 1.1 }}
              className="absolute top-1/2 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-royal-700 shadow-lg"
            >
              <Play size={22} fill="currentColor" className="ml-0.5" />
            </motion.span>
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {video.tag && (
          <span className="mb-2 w-fit rounded-full bg-gold-100 px-2.5 py-1 text-[0.65rem] font-semibold tracking-wide text-gold-700 uppercase">
            {video.tag}
          </span>
        )}
        <h3 className="font-heading text-sm leading-snug font-semibold text-ink">{video.title}</h3>
        {video.description && (
          <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-mist-700">
            {video.description}
          </p>
        )}
        {video.tag === "Pre-Course Video" && (
          <p className="mt-3 text-[0.7rem] font-medium text-royal-700">
            Part of the Vector ECG pre-course series
          </p>
        )}
      </div>
    </div>
  );
}
