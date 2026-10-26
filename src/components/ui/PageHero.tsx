import { ReactNode } from "react";
import { Reveal } from "./Reveal";
import { Aurora, HeartbeatLine } from "./Motion";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

/** Standard inner-page header band: drifting glows, a self-drawing ECG trace and room for the fixed nav. */
export function PageHero({ eyebrow, title, description, children, className }: PageHeroProps) {
  return (
    <section className={cn("relative overflow-hidden bg-royal-950 px-5 pt-36 pb-20 text-white sm:px-8 sm:pt-44 sm:pb-28", className)}>
      <Aurora />
      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-30" />
      <HeartbeatLine beats={6} className="absolute inset-x-0 bottom-0 h-16 w-full opacity-50 sm:h-20" />
      <div className="relative mx-auto max-w-4xl text-center">
        <Reveal>
          {eyebrow && (
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-[0.18em] text-gold-300 uppercase backdrop-blur">
              <span className="size-1.5 animate-pulse rounded-full bg-gold-400" aria-hidden="true" />
              {eyebrow}
            </span>
          )}
          <h1 className="font-heading text-4xl leading-tight font-semibold text-balance text-white sm:text-6xl">{title}</h1>
          {description && <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-royal-100">{description}</p>}
          {children}
        </Reveal>
      </div>
    </section>
  );
}
