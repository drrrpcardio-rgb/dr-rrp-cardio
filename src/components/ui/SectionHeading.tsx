import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  tone?: "light" | "dark";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  tone = "light",
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
          <span className={`mb-3 inline-block text-xs font-semibold tracking-[0.2em] uppercase ${tone === "dark" ? "text-gold-300" : "text-gold-700"}`}>
            {eyebrow}
          </span>
        )}
        <h2 className={cn("text-3xl leading-tight font-semibold sm:text-5xl", tone === "dark" ? "text-white" : "text-ink")}>
          {title}
        </h2>
        {description && (
          <p className={cn("mt-4 text-base leading-relaxed sm:text-lg", tone === "dark" ? "text-royal-100" : "text-mist-700")}>
            {description}
          </p>
        )}
      </Reveal>
    </div>
  );
}
