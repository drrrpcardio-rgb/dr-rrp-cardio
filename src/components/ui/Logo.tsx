import { cn } from "@/lib/utils";
import { brand } from "@/lib/site-data";

interface LogoProps {
  className?: string;
  /** Show the "Cardio" lockup line beneath the wordmark. */
  withLockup?: boolean;
  /** Light-on-dark variant for use over navy backgrounds. */
  light?: boolean;
}

/**
 * Dr. RRP Cardio logo: a royal-blue ring around a bold gold ECG beat (no
 * filled background), beside a two-line wordmark ("Dr. RRP" over "Cardio"). Inline SVG + text so it stays crisp at any size
 * (nav, footer, favicon — see public/favicon.svg, which mirrors the badge).
 * Text pulls from `brand` in site-data.ts.
 */
export function Logo({ className, withLockup = true, light = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <circle
          cx="22"
          cy="22"
          r="20"
          stroke={light ? "#fff" : "var(--color-royal-700)"}
          strokeWidth="2.2"
        />
        <path
          d="M6.5 24H14C15 21.8 17 21.8 18 24H19.5L21 27L24 9.5L27.5 34L29.5 24H31C32.5 20.4 35 20.4 36.5 24H37.5"
          stroke="var(--color-gold-400)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="leading-none">
        <span
          className={cn(
            "block font-heading text-[1.05rem] font-semibold tracking-wide transition-colors",
            light ? "text-white" : "text-royal-800",
          )}
        >
          {brand.wordmarkTop}
        </span>
        {withLockup && (
          <span
            className={cn(
              "mt-0.5 block text-[0.55rem] font-semibold tracking-[0.25em] uppercase transition-colors",
              light ? "text-gold-300" : "text-gold-700",
            )}
          >
            {brand.wordmarkBottom}
          </span>
        )}
      </div>
    </div>
  );
}
