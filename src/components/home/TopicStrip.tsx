import { Marquee } from "@/components/ui/Motion";

const topics = [
  "12-lead ECG",
  "Arrhythmias",
  "STEMI equivalents",
  "Transthoracic echo",
  "Doppler & haemodynamics",
  "Valve disease",
  "Coronary angiography",
  "Guide catheter selection",
  "IVUS",
  "Primary PCI",
  "Structural cases",
  "Cath lab workflow",
];

/** A slow ticker of what is taught, between the hero highlights and the rest of the page. */
export function TopicStrip() {
  return (
    <section aria-label="Topics we teach" className="mt-16 py-2">
      <Marquee
        items={topics.map((t) => (
          <span key={t} className="flex items-center gap-6 px-3 font-heading text-xl font-medium whitespace-nowrap text-royal-900/80 sm:text-2xl">
            {t}
            <svg viewBox="0 0 40 16" className="h-4 w-10 text-gold-500" aria-hidden="true">
              <path d="M0 8h12l3-6 4 12 3-6h18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        ))}
      />
    </section>
  );
}
