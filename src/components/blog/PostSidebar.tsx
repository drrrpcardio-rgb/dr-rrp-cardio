"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  text: string;
}

/** Thin reading-progress bar fixed to the top of the window. */
export function ReadingProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.getElementById("post-body");
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.5;
      setPct(Math.min(100, Math.max(0, ((window.innerHeight * 0.3 - r.top) / total) * 100)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <div aria-hidden="true" className="fixed inset-x-0 top-0 z-[60] h-1 bg-transparent">
      <div className="h-full bg-gold-400" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** "In this post": sticky on large screens with the current section highlighted, a collapsible list on phones. */
export function TableOfContents({ items, variant }: { items: TocItem[]; variant: "mobile" | "sidebar" | "panel" }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const heads = items.map((i) => document.getElementById(i.id)).filter((h): h is HTMLElement => !!h);
    if (heads.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    heads.forEach((h) => obs.observe(h));
    return () => obs.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  const list = (
    <ol className="space-y-1.5 text-sm">
      {items.map((i) => (
        <li key={i.id}>
          <a
            href={`#${i.id}`}
            className={cn(
              "block border-l-2 py-1 pl-3 transition-colors",
              active === i.id
                ? "border-gold-400 font-semibold text-royal-800"
                : "border-mist-200 text-mist-700 hover:border-royal-300 hover:text-royal-700",
            )}
          >
            {i.text}
          </a>
        </li>
      ))}
    </ol>
  );

  if (variant === "panel") {
    return (
      <div>
        <p className="mb-3 text-xs font-semibold tracking-widest text-mist-600 uppercase">On this page</p>
        {list}
      </div>
    );
  }
  if (variant === "mobile") {
    return (
      <details className="mb-8 rounded-xl border border-mist-200 bg-mist-50 px-4 py-3 lg:hidden">
        <summary className="cursor-pointer text-sm font-semibold text-royal-800">In this post</summary>
        <div className="mt-3">{list}</div>
      </details>
    );
  }
  return (
    <aside className="sticky top-28 hidden self-start lg:block">
      <p className="mb-3 text-xs font-semibold tracking-widest text-mist-600 uppercase">In this post</p>
      {list}
    </aside>
  );
}
