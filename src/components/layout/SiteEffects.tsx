"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";

/**
 * Small site-wide effects, mounted once in the root layout:
 * - a gold progress bar at the top while a new page loads,
 * - the cursor spotlight on `.spotlight` cards,
 * - a back-to-top button with a scroll-progress ring.
 */
export function SiteEffects() {
  return (
    <>
      <RouteProgress />
      <SpotlightTracker />
      <BackToTop />
    </>
  );
}

function RouteProgress() {
  const pathname = usePathname();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [prev, setPrev] = useState(pathname);

  // Finish the bar when the new page has rendered (state adjusted during render, not in an effect).
  if (pathname !== prev) {
    setPrev(pathname);
    if (state === "loading") setState("done");
  }

  useEffect(() => {
    if (state !== "done") return;
    const t = setTimeout(() => setState("idle"), 450);
    return () => clearTimeout(t);
  }, [state]);

  useEffect(() => {
    // Start on clicks to internal links that go to another page.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      // Static pages served outside the Next app (the simulators) load as full pages: no bar needed.
      setState("loading");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (state === "idle") return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px]">
      <div
        className="h-full origin-left bg-gradient-to-r from-gold-400 via-gold-300 to-gold-400 shadow-[0_0_10px_var(--color-gold-400)]"
        style={
          state === "loading"
            ? { animation: "route-progress 8s cubic-bezier(.1,.7,.2,1) forwards" }
            : { transform: "scaleX(1)", opacity: 0, transition: "transform .2s ease-out, opacity .3s ease .2s" }
        }
      />
    </div>
  );
}

function SpotlightTracker() {
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element).closest?.(".spotlight") as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
      el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => document.removeEventListener("pointermove", onMove);
  }, []);
  return null;
}

function BackToTop() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const show = progress > 0.08;
  const C = 2 * Math.PI * 20;
  return (
    <button
      type="button"
      aria-label="Back to top"
      tabIndex={show ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`no-print fixed right-5 bottom-5 z-40 flex size-12 items-center justify-center rounded-full bg-royal-900 text-gold-300 shadow-lg shadow-royal-950/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-royal-800 ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="24" cy="24" r="20" fill="none" stroke="rgb(255 255 255 / .12)" strokeWidth="2.5" />
        <circle cx="24" cy="24" r="20" fill="none" stroke="var(--color-gold-400)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - progress)} />
      </svg>
      <ArrowUp size={18} aria-hidden="true" />
    </button>
  );
}
