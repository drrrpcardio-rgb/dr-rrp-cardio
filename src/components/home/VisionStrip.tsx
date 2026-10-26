import { Reveal } from "@/components/ui/Reveal";

export function VisionStrip() {
  return (
    <section className="relative bg-white">
      <div className="mx-auto max-w-4xl px-5 pt-20 pb-16 text-center sm:px-8 sm:pt-24 sm:pb-20">
        <Reveal>
          <p className="font-heading text-2xl leading-snug font-medium text-ink sm:text-4xl sm:leading-tight">
            &ldquo;We teach cardiology the way it&rsquo;s practised: one waveform, one window, one case at a time, so learning translates
            directly to the bedside, the echo lab and the cath lab floor.&rdquo;
          </p>
          <div className="mx-auto mt-7 h-1 w-16 rounded-full bg-gold-400" />
        </Reveal>
      </div>
    </section>
  );
}
