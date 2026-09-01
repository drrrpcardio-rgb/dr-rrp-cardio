import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      <Reveal>
        {eyebrow && (
          <span className="mb-3 inline-block text-xs font-semibold tracking-[0.2em] text-gold-700 uppercase">
            {eyebrow}
          </span>
        )}
        <h2 className="text-3xl leading-tight font-semibold text-ink sm:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="mt-4 text-base leading-relaxed text-mist-700">
            {description}
          </p>
        )}
      </Reveal>
    </div>
  );
}
