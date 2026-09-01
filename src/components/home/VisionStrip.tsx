import { Reveal } from "@/components/ui/Reveal";

export function VisionStrip() {
  return (
    <section className="border-y border-mist-200 bg-mist-50">
      <div className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 sm:py-28">
        <Reveal>
          <p className="font-heading text-2xl leading-relaxed text-ink-soft italic sm:text-3xl">
            &ldquo;We teach cardiology the way it&rsquo;s practised — one waveform,
            one window, one case at a time — so learning translates directly
            to the bedside, the echo lab, and the cath lab floor.&rdquo;
          </p>
        </Reveal>
      </div>
    </section>
  );
}
