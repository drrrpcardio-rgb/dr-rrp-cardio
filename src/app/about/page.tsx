import type { Metadata } from "next";
import Image from "next/image";
import { BookOpen, Lightbulb, Stethoscope } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { brand, founder } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "About",
  description: `The story and teaching philosophy behind ${brand.name}.`,
};

const steps = [
  { icon: BookOpen, title: "Learn", text: "A clear framework first: what to look for, in what order, and why." },
  { icon: Lightbulb, title: "Understand", text: "Repeated exposure to real cases until the framework becomes automatic." },
  { icon: Stethoscope, title: "Apply", text: "Hands-on time and simulators, so the skill carries over to the bedside." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Us"
        title="Why the name"
        description="Cardiology is learnable by anyone willing to be systematic about it. That's the idea this institution is built on."
      />

      <section className="mx-auto max-w-3xl px-5 pt-20 pb-12 sm:px-8">
        <Reveal>
          <p className="font-heading text-2xl leading-snug text-ink sm:text-3xl">
            Most clinicians aren&rsquo;t short on exposure. What they&rsquo;re short on is a repeatable system for working through what they see.
          </p>
          <p className="mt-6 leading-relaxed text-mist-700">
            They&rsquo;ve seen enough ECGs, echo studies and cath lab cases to fill a career. {brand.name} exists to teach the system deliberately and
            in the open, instead of leaving it to be picked up by osmosis over years of practice.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map(({ icon: Icon, ...s }, i) => (
            <Reveal key={s.title} delay={i * 0.08}>
              <div className="h-full rounded-3xl border border-mist-200 bg-white p-7">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-royal-50 text-royal-700">
                  <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <p className="mt-5 text-xs font-semibold tracking-[0.2em] text-gold-700 uppercase">Step {i + 1}</p>
                <h2 className="mt-1 font-heading text-2xl font-semibold text-ink">{s.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-mist-700">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed text-mist-700">
            &ldquo;Learn. Understand. Apply.&rdquo; isn&rsquo;t a slogan picked for how it sounds. It&rsquo;s the sequence every course, workshop and
            live class is built around. Lectures stay tight; hands-on time stays generous.
          </p>
        </Reveal>
      </section>

      <section className="bg-royal-950 py-20 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-3xl">
              <Image src="/images/founder-portrait-2.jpg" alt={`${founder.name}, ${founder.role}`} fill sizes="(max-width: 1024px) 90vw, 400px" className="object-cover object-top" />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-xs font-semibold tracking-[0.2em] text-gold-300 uppercase">The institution behind the teacher</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold sm:text-4xl">{founder.name}</h2>
            <p className="mt-1 text-sm text-royal-200">
              {founder.title} · {founder.credentials} · {founder.role}
            </p>
            <div className="mt-6 space-y-4 leading-relaxed text-royal-100">
              <p>
                The name is a decision, not a default. A faceless brand would have let the institution carry the weight. We chose the opposite, putting
                the person doing the teaching front and centre, because the credibility here was earned in clinics and cath labs.
              </p>
              <p>
                But carrying a founder&rsquo;s name doesn&rsquo;t mean depending on one. Courses, curricula and quality standards are built to stand
                on their own: designed once, taught consistently, and in time delivered by a wider faculty.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/courses" variant="gold" size="lg">
                Explore courses
              </Button>
              <Button href="/faculty" variant="ghost" size="lg" className="border border-white/30 text-white hover:bg-white/10">
                Meet the faculty
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
