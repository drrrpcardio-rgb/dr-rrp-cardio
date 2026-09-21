import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { brand, founder } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "About",
  description: `The story and teaching philosophy behind ${brand.name}.`,
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Us"
        title="Why the name"
        description="Cardiology is learnable by anyone willing to be systematic about it. That's the idea this institution is built on."
      />

      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
        <div className="space-y-8 text-base leading-relaxed text-mist-700">
          <Reveal>
            <p>
              Most clinicians aren&rsquo;t short on exposure &mdash; they&rsquo;ve
              seen enough ECGs, echo studies, and cath lab cases to fill a
              career. What they&rsquo;re short on is a repeatable system for
              working through them. {brand.name} exists to teach that system
              deliberately and in the open, instead of leaving it to be picked
              up by osmosis over years of practice.
            </p>
          </Reveal>

          <Reveal delay={0.05}>
            <p>
              The name itself is a decision, not a default. A faceless brand
              name would have let us mention the founder in the fine print and
              let the institution carry the weight. We chose the opposite
              &mdash; putting the person doing the teaching front and center,
              because the credibility here was earned in clinics and cath labs,
              not manufactured by a marketing team. &ldquo;Learn. Understand.
              Apply.&rdquo; isn&rsquo;t a slogan picked for how it sounds.
              It&rsquo;s the actual sequence every course is built around.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <h2 className="font-heading pt-4 text-2xl font-semibold text-ink">
              A practical teaching philosophy
            </h2>
            <p className="mt-4">
              Every course, workshop, and live class follows the same shape: a
              clear framework first, then repeated exposure to real clinical
              cases until that framework becomes automatic. Lectures stay
              tight. Hands-on time stays generous. Interpretation is a skill
              you build by doing it &mdash; not by watching someone else do it.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <h2 className="font-heading pt-4 text-2xl font-semibold text-ink">
              The institution behind the teacher
            </h2>
            <p className="mt-4">
              The initials are {founder.name}&rsquo;s own, and that&rsquo;s
              deliberate &mdash; the credibility here comes from a practising
              cardiologist willing to put his name behind every course. But
              carrying a founder&rsquo;s name doesn&rsquo;t mean depending on
              one. Courses, curricula, and quality standards are designed to
              stand on their own &mdash; built once, taught consistently, and
              eventually delivered by a wider faculty &mdash; rather than
              resting on any one person in the room.
            </p>
            <p className="mt-4">
              The goal is an academy learners can trust independent of who
              happens to be teaching a given session &mdash; built on a
              foundation that one experienced, practising cardiologist laid
              first.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
