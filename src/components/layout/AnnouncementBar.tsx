"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { announcement } from "@/lib/site-data";
import { useAnnouncementVisible } from "@/lib/use-announcement";

/**
 * Thin site-wide strip at the very top of the fixed header, above the nav
 * row (see Nav.tsx). Config lives in one place — `announcement` in
 * site-data.ts — so updating the message, link, or turning it off is a
 * one-line change there, not a code change here.
 */
export function AnnouncementBar() {
  const { visible, dismiss } = useAnnouncementVisible();

  if (!announcement.enabled || !visible) return null;

  return (
    <div className="flex items-center justify-center gap-3 bg-royal-800 px-4 py-2 text-xs text-white sm:text-sm">
      <span
        aria-hidden="true"
        className="hidden h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-gold-400 sm:inline-block"
      />
      {/* The link is a separate, non-shrinking flex item so it's never the
          part that gets clipped — only the message text truncates. */}
      <p className="min-w-0 truncate">{announcement.text}</p>
      <Link
        href={announcement.href}
        className="shrink-0 font-semibold whitespace-nowrap underline-offset-2 hover:underline"
      >
        {announcement.linkLabel} →
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="ml-1 shrink-0 rounded p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X size={14} />
      </button>
    </div>
  );
}
