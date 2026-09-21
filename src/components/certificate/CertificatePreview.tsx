import { cn } from "@/lib/utils";
import { brand, founder } from "@/lib/site-data";

interface CertificatePreviewProps {
  type?: "completion" | "participation";
  participantName?: string;
  courseName?: string;
  date?: string;
  certificateNumber?: string;
  className?: string;
}

/**
 * Print/PDF-ready certificate template. Landscape, roughly A4 proportions
 * (297:210 ≈ 1.414:1). Swap the default props for real data when wiring up
 * generation — the layout is deliberately kept simple so it holds up at
 * print resolution.
 */
export function CertificatePreview({
  type = "completion",
  participantName = "Participant Name",
  courseName = "RRP Cardio ECG – Level 1",
  date = "23rd August 2026",
  certificateNumber = "RRPC-ECG1-000123",
  className,
}: CertificatePreviewProps) {
  return (
    <div
      className={cn(
        "relative mx-auto aspect-[297/210] w-full max-w-3xl bg-white p-3",
        "rounded-md border border-mist-200 shadow-xl shadow-royal-900/10",
        className,
      )}
    >
      <div className="relative flex h-full w-full flex-col items-center justify-between border-2 border-royal-700 px-6 py-6 text-center sm:px-12 sm:py-10">
        {/* corner accents */}
        <span className="absolute top-2 left-2 h-6 w-6 border-t-2 border-l-2 border-gold-400 sm:h-10 sm:w-10" />
        <span className="absolute top-2 right-2 h-6 w-6 border-t-2 border-r-2 border-gold-400 sm:h-10 sm:w-10" />
        <span className="absolute bottom-2 left-2 h-6 w-6 border-b-2 border-l-2 border-gold-400 sm:h-10 sm:w-10" />
        <span className="absolute right-2 bottom-2 h-6 w-6 border-r-2 border-b-2 border-gold-400 sm:h-10 sm:w-10" />

        <div>
          <p className="font-heading text-lg font-semibold tracking-wide text-royal-800 sm:text-2xl">
            {brand.name.toUpperCase()}
          </p>
          <p className="mt-2 text-[0.6rem] font-semibold tracking-[0.25em] text-gold-700 uppercase sm:text-xs">
            Certificate of {type === "completion" ? "Completion" : "Participation"}
          </p>
        </div>

        <div className="max-w-xl">
          <p className="text-[0.65rem] text-mist-700 sm:text-sm">This is to certify that</p>
          <p className="font-heading mt-1 text-xl font-semibold text-ink sm:text-3xl">
            {participantName}
          </p>
          <p className="mt-2 text-[0.65rem] leading-relaxed text-mist-700 sm:text-sm">
            has successfully {type === "completion" ? "completed" : "participated in"}{" "}
            <span className="font-semibold text-ink-soft">{courseName}</span> conducted by
            {" "}{brand.name}.
          </p>
        </div>

        <div className="flex w-full items-end justify-between text-left">
          <div className="text-[0.55rem] text-mist-700 sm:text-xs">
            <p>Course Date: {date}</p>
            <p>Certificate No: {certificateNumber}</p>
          </div>

          <div
            aria-hidden="true"
            className="grid h-10 w-10 grid-cols-4 grid-rows-4 gap-px border border-mist-300 p-1 sm:h-14 sm:w-14"
          >
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className={cn("bg-white", i % 3 === 0 && "bg-ink")} />
            ))}
          </div>

          <div className="text-center">
            <div className="mb-1 h-px w-20 bg-ink-soft sm:w-28" />
            <p className="text-[0.55rem] font-medium text-ink-soft sm:text-xs">{founder.name}</p>
            <p className="text-[0.5rem] text-mist-600 sm:text-[0.65rem]">
              {founder.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
