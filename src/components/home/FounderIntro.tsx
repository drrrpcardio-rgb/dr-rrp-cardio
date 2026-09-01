import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";
import { founder } from "@/lib/site-data";

export function FounderIntro() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal>
          <div className="relative mx-auto max-w-sm">
            <div className="absolute -top-4 -left-4 h-full w-full rounded-2xl border-2 border-gold-300" />
            <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-mist-100 shadow-lg">
              <Image
                src="/images/founder-portrait-1.jpg"
                alt={`${founder.name}, ${founder.role}, Vector Cardiology Academy`}
                fill
                sizes="(max-width: 768px) 90vw, 420px"
                className="object-cover"
              />
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <span className="mb-3 inline-block text-xs font-semibold tracking-[0.2em] text-gold-700 uppercase">
            Founder
          </span>
          <h2 className="text-3xl leading-tight font-semibold text-ink sm:text-4xl">
            {founder.name}
          </h2>
          <p className="mt-2 text-sm font-medium text-royal-700">
            {founder.role}, Vector Cardiology Academy
          </p>
          <p className="mt-1 text-sm text-mist-700">
            {founder.title} &middot; {founder.credentials}
          </p>
          <blockquote className="mt-6 border-l-2 border-gold-300 pl-5 font-heading text-xl leading-relaxed text-ink-soft italic">
            &ldquo;Cardiology is learnable by anyone willing to be systematic
            about it. My aim is to make that system explicit.&rdquo;
          </blockquote>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-mist-700">
            {founder.name} has spent years teaching ECG, echocardiography, and cath
            lab fundamentals to doctors, postgraduates, and technologists —
            first at the bedside, then in structured classroom sessions, and
            now through Vector Cardiology Academy. The teaching approach
            stays the same at every scale: break the skill into a repeatable
            system, then apply it to real cases until it becomes second
            nature.
          </p>
          <div className="mt-8">
            <Button href="/faculty" variant="secondary" icon={<ArrowRight size={16} />}>
              More about the faculty
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
