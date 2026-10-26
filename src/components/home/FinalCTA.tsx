import { ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Aurora, HeartbeatLine } from "@/components/ui/Motion";

/** Closing call to action on the home page. */
export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-royal-950 py-28 text-white">
      <Aurora />
      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-25" />
      <HeartbeatLine beats={6} className="absolute inset-x-0 top-1/2 h-32 w-full -translate-y-1/2 opacity-[0.18]" />
      <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.2em] text-gold-300 uppercase">Your next step</p>
          <h2 className="mt-4 font-heading text-4xl leading-tight font-semibold sm:text-5xl">
            Ready to learn cardiology <span className="text-shimmer">the structured way?</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-royal-100">
            Tell us what you want to learn and we will let you know when the next course, live class or workshop opens.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Button href="/contact" variant="gold" size="lg" icon={<ArrowRight size={18} />}>
              Enquire Now
            </Button>
            <Button
              href="/simulators"
              variant="ghost"
              size="lg"
              className="border border-white/30 text-white hover:bg-white/10"
              icon={<PlayCircle size={18} />}
            >
              Try a free simulator
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
