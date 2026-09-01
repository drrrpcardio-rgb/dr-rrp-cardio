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
        "border-b border-mist-200 bg-gradient-to-b from-royal-50 to-white px-5 pt-36 pb-16 sm:px-8 sm:pt-44 sm:pb-20",
        className,
      )}
    >
      <div className="mx-auto max-w-4xl text-center">
        <Reveal>
          {eyebrow && (
            <span className="mb-3 inline-block text-xs font-semibold tracking-[0.2em] text-gold-700 uppercase">
              {eyebrow}
            </span>
          )}
          <h1 className="font-heading text-4xl leading-tight font-semibold text-ink sm:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-mist-700">
              {description}
            </p>
          )}
          {children}
        </Reveal>
      </div>
    </section>
  );
}
