"use client";

import { useCallback, useSyncExternalStore } from "react";
import { announcement } from "@/lib/site-data";

const storageKey = `dismissed-announcement:${announcement.id}`;
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  if (!announcement.enabled) return false;
  try {
    return localStorage.getItem(storageKey) !== "1";
  } catch {
    return true;
  }
}

/**
 * The static export has no localStorage at build time, so the prerendered
 * HTML never shows the bar. Returning `false` here too means the client's
 * first hydration pass matches that exactly — no mismatch — then
 * useSyncExternalStore re-renders with the real value right after mount.
 */
function getServerSnapshot() {
  return false;
}

/** Tracks whether the site-wide announcement bar should be shown. */
export function useAnnouncementVisible() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      // Storage unavailable (private browsing, etc.) — bar just won't stay dismissed.
    }
    listeners.forEach((l) => l());
  }, []);

  return { visible, dismiss };
}
