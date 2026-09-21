import { ReactNode } from "react";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

/** Standard inner-page header band: royal-tinted background, generous top padding for the fixed nav. */
export function PageHero({ eyebrow, title, description, children, className }: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-royal-950 px-5 pt-36 pb-16 text-white sm:px-8 sm:pt-44 sm:pb-24",
        className,
      )}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_0%,var(--color-royal-700)_0%,transparent_60%)] opacity-80" />
      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-4xl text-center">
        <Reveal>
          {eyebrow && (
            <span className="mb-3 inline-block text-xs font-semibold tracking-[0.2em] text-gold-300 uppercase">
              {eyebrow}
            </span>
          )}
          <h1 className="font-heading text-4xl leading-tight font-semibold text-white sm:text-6xl">
            {title}
          </h1>
          {description && (
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-royal-100">
              {description}
            </p>
          )}
          {children}
        </Reveal>
      </div>
    </section>
  );
}
