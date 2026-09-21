import { Reveal } from "@/components/ui/Reveal";

export function VisionStrip() {
  return (
    <section className="relative bg-white">
      <div className="mx-auto max-w-5xl px-5 py-24 sm:px-8 sm:py-32">
        <Reveal>
          <span aria-hidden="true" className="font-heading block text-8xl leading-none text-gold-400">
            &ldquo;
          </span>
          <p className="font-heading -mt-6 text-3xl leading-snug font-medium text-ink sm:text-5xl sm:leading-tight">
            We teach cardiology the way it&rsquo;s practised &mdash; one waveform, one window, one
            case at a time &mdash; so learning translates directly to the bedside, the echo lab,
            and the cath lab floor.
          </p>
          <div className="mt-8 h-1 w-20 rounded-full bg-gold-400" />
        </Reveal>
      </div>
    </section>
  );
}
