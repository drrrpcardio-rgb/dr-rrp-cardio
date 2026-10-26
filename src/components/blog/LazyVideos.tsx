"use client";

import { useEffect } from "react";

/**
 * Plays the looping case clips (`video[data-autoplay]`) only while they are on screen, so a post with many
 * clips does not download all of them up front.
 */
export function LazyVideos({ rootId }: { rootId: string }) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;
    const videos = Array.from(root.querySelectorAll<HTMLVideoElement>("video[data-autoplay]"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting) v.play().catch(() => {});
          else v.pause();
        }
      },
      { rootMargin: "200px 0px" },
    );
    videos.forEach((v) => observer.observe(v));
    return () => observer.disconnect();
  }, [rootId]);
  return null;
}
