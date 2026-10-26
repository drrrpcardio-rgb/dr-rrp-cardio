"use client";

import { useEffect, useRef, useState } from "react";
import { Expand, Loader2, Minimize } from "lucide-react";

const SRC = "/echo-lab/index.html";

/** The echo lab iframe with a loading cover and a fullscreen button (opens the lab on its own page where fullscreen is not supported). */
export function EchoLabFrame() {
  const wrap = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [full, setFull] = useState(false);

  // The iframe can finish loading before React hydrates, so check once on mount too
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- iframe may already be loaded
      if (frame.current?.contentDocument?.readyState === "complete") setLoading(false);
    } catch {}
    const t = setTimeout(() => setLoading(false), 15000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const sync = () => setFull(document.fullscreenElement === wrap.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggle = async () => {
    const el = wrap.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (el.requestFullscreen) await el.requestFullscreen();
      else window.open(SRC, "_self"); // a static page outside the Next app
    } catch {
      window.open(SRC, "_self"); // a static page outside the Next app
    }
  };

  return (
    <div
      ref={wrap}
      className="relative flex flex-col h-[calc(100svh-5rem)] min-h-[560px] w-full overflow-hidden rounded-3xl border border-royal-200 bg-royal-950 shadow-2xl sm:h-[88vh] sm:min-h-[640px] lg:h-[900px] [&:fullscreen]:h-screen [&:fullscreen]:rounded-none [&:fullscreen]:border-0"
    >
      <iframe
        ref={frame}
        src={SRC}
        title="Dr. RRP Cardio Echo Lab"
        allow="fullscreen; clipboard-write"
        allowFullScreen
        onLoad={() => setLoading(false)}
        className="w-full flex-1 border-0"
      />
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-royal-950 text-royal-100" role="status">
          <Loader2 className="size-8 animate-spin text-gold-400" aria-hidden="true" />
          <p className="text-sm">Loading the echo lab…</p>
        </div>
      )}
      <div className="flex shrink-0 items-center justify-end border-t border-royal-800 bg-royal-950 px-3 py-1.5">
        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-royal-100 hover:bg-royal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
        >
          {full ? <Minimize className="size-3.5" aria-hidden="true" /> : <Expand className="size-3.5" aria-hidden="true" />}
          {full ? "Exit full screen" : "Full screen"}
        </button>
      </div>
    </div>
  );
}
