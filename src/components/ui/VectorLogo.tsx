import { cn } from "@/lib/utils";
import { brand } from "@/lib/site-data";

interface VectorLogoProps {
  className?: string;
  /** Show the "Cardio" lockup line beneath the wordmark. */
  withLockup?: boolean;
  monochrome?: boolean;
}

/**
 * Dr. RRP Cardio wordmark: "Dr. RRP" set in the heading face over a small
 * "Cardio" lockup line, with an ECG-trace-into-arrow motif standing in for a
 * dot — tucked to the right of the wordmark instead. Built as inline SVG +
 * text so it stays crisp at favicon size and scales cleanly on the
 * certificate template. Text pulls from `brand` in site-data.ts.
 */
export function VectorLogo({
  className,
  withLockup = true,
  monochrome = false,
}: VectorLogoProps) {
  const royal = monochrome ? "currentColor" : "var(--color-royal-700)";
  const gold = monochrome ? "currentColor" : "var(--color-gold-400)";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width="34"
        height="34"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <circle cx="20" cy="20" r="19" stroke={royal} strokeWidth="1.5" />
        <path
          d="M6 22 L13 22 L16 14 L20 28 L23 20 L26 22 L34 22"
          stroke={royal}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M26 22 L34 22 L30.5 18.5 M34 22 L30.5 25.5"
          stroke={gold}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <div className="leading-tight">
        <span className="block font-heading text-[1.05rem] font-semibold tracking-wide text-royal-800">
          {brand.wordmarkTop}
        </span>
        {withLockup && (
          <span className="block text-[0.55rem] font-medium tracking-[0.18em] text-mist-700 uppercase">
            {brand.wordmarkBottom}
          </span>
        )}
      </div>
    </div>
  );
}
