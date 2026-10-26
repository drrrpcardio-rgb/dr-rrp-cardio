import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Slow drifting colour glows for dark bands. Place inside a `relative overflow-hidden` section. */
export function Aurora({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("aurora", className)}>
      <span />
      <span />
      <span />
    </div>
  );
}

const BEAT =
  "c4 -14 24 -14 28 0 L62 100 L66 107 L76 18 L86 132 L92 100 L112 100 c10 -28 44 -28 54 0 L200 100";

/** One ECG beat repeated across the width; built so each segment starts where the last ended. */
function tracePath(beats: number) {
  let d = "M0 100 L20 100 ";
  for (let i = 0; i < beats; i++) {
    const x = i * 200;
    d += BEAT.replace(/L(\d+) /g, (_m, n: string) => `L${Number(n) + x} `);
    if (i < beats - 1) d += ` L${220 + x} 100 `;
  }
  return d;
}

/** A gold ECG trace that draws itself once, then a white pulse keeps running along it. CSS only. */
export function HeartbeatLine({ className, beats = 8 }: { className?: string; beats?: number }) {
  const d = tracePath(beats);
  return (
    <svg
      viewBox={`0 0 ${beats * 200} 200`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("heartbeat pointer-events-none", className)}
    >
      <path d={d} pathLength={1} fill="none" stroke="var(--color-gold-400)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <path d={d} pathLength={1} fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Endless horizontal ticker. Items are rendered twice so the loop is seamless; the copy is hidden from screen readers. */
export function Marquee({ items, className }: { items: ReactNode[]; className?: string }) {
  return (
    <div className={cn("marquee", className)}>
      <div className="marquee__track">
        {[0, 1].map((copy) => (
          <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center">
            {items.map((item, i) => (
              <li key={i} className="flex items-center">
                {item}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
