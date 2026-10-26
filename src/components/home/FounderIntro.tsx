import Image from "next/image";
import { ArrowRight, Award, GraduationCap, Quote } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { brand, founder } from "@/lib/site-data";

const teaches = ["ECG", "Echocardiography", "Cath lab", "IVUS", "Interventional cardiology"];

export function FounderIntro() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="absolute top-1/2 -left-40 size-[34rem] -translate-y-1/2 rounded-full bg-royal-100/60 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-28 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <Reveal>
          <div className="relative mx-auto max-w-sm">
            {/* Gradient frame */}
            <div className="rounded-[2rem] bg-gradient-to-br from-gold-300 via-gold-500 to-royal-700 p-[3px] shadow-2xl shadow-royal-900/25">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[calc(2rem-3px)] bg-mist-100">
                <Image
                  src="/images/founder-portrait-1.jpg"
                  alt={`${founder.name}, ${founder.role}, ${brand.name}`}
                  fill
                  sizes="(max-width: 768px) 90vw, 420px"
                  className="object-cover object-top"
                />
              </div>
            </div>

            {/* Floating credential cards */}
            <div className="float-slow absolute -right-4 bottom-10 flex items-center gap-3 rounded-2xl border border-mist-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur sm:-right-10">
              <span className="flex size-10 items-center justify-center rounded-xl bg-royal-900 text-gold-300">
                <GraduationCap size={20} aria-hidden="true" />
              </span>
              <span className="leading-tight">
                <span className="block font-heading text-base font-semibold text-ink">{founder.credentials}</span>
                <span className="block text-xs text-mist-600">{founder.title}</span>
              </span>
            </div>
            <div className="float-slower absolute -top-5 -left-4 flex items-center gap-2 rounded-full bg-gold-400 px-4 py-2 text-xs font-bold tracking-wider text-royal-950 uppercase shadow-lg sm:-left-8">
              <Award size={15} aria-hidden="true" /> {founder.role}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <span className="mb-4 inline-flex items-center gap-3 text-xs font-semibold tracking-[0.2em] text-gold-700 uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-gold-400" />
            Meet the founder
          </span>
          <h2 className="text-4xl leading-tight font-semibold text-ink sm:text-5xl">{founder.name}</h2>
          <p className="mt-3 text-sm font-medium text-royal-700">
            {founder.role}, {brand.name}
          </p>

          <blockquote className="relative mt-8 rounded-3xl bg-royal-950 p-7 pl-8 text-white shadow-xl shadow-royal-900/20 sm:p-8">
            <Quote aria-hidden="true" className="absolute -top-5 left-7 size-10 rounded-xl bg-gold-400 p-2 text-royal-950" />
            <p className="font-heading text-xl leading-relaxed italic sm:text-2xl">
              &ldquo;Cardiology is learnable by anyone willing to be systematic about it. My aim is to make that system explicit.&rdquo;
            </p>
          </blockquote>

          <p className="mt-8 max-w-xl text-base leading-relaxed text-mist-700">
            {founder.name} has spent years teaching ECG, echocardiography and cath lab fundamentals to doctors, postgraduates and technologists:
            first at the bedside, then in structured classroom sessions, and now through {brand.name}. The method stays the same at every scale.
            Break the skill into a repeatable system, then apply it to real cases until it becomes second nature.
          </p>

          <ul className="mt-6 flex flex-wrap gap-2">
            {teaches.map((t) => (
              <li key={t} className="rounded-full border border-royal-100 bg-royal-50 px-3 py-1 text-xs font-semibold text-royal-800">
                {t}
              </li>
            ))}
          </ul>

          <div className="mt-9">
            <Button href="/faculty" variant="primary" icon={<ArrowRight size={16} />}>
              More about the faculty
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
