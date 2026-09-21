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
        description="An institution built around one idea: that cardiology is learnable by anyone willing to be systematic about it."
      />

      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
        <div className="space-y-8 text-base leading-relaxed text-mist-700">
          <Reveal>
            <p>
              {brand.name} started from a simple observation: most
              clinicians aren&rsquo;t short on exposure to ECGs, echo
              studies, or cath lab cases — they&rsquo;re short on a
              repeatable system for working through them. {brand.name}{" "}
              exists to teach that system, deliberately and in the open,
              rather than leaving it to be picked up by osmosis over years
              of practice.
            </p>
          </Reveal>

          <Reveal delay={0.05}>
            <p>
              The brand carries a name for a reason. Rather than build a
              faceless brand and mention the founder in the fine print,{" "}
              {brand.name} puts the person doing the teaching front and
              centre — the credibility here is earned in clinics and cath
              labs, not manufactured by an institution&rsquo;s marketing.
              &ldquo;Learn. Understand. Apply.&rdquo; isn&rsquo;t a slogan we
              picked for the sound of it; it describes the actual sequence
              every course is built around.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <h2 className="font-heading pt-4 text-2xl font-semibold text-ink">
              A practical teaching philosophy
            </h2>
            <p className="mt-4">
              Every course, workshop, and live class follows the same shape:
              a clear framework first, then repeated exposure to real
              clinical cases until that framework becomes automatic. We keep
              lectures tight and hands-on time generous, because
              interpretation is a skill you build by doing it, not by
              watching someone else do it.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <h2 className="font-heading pt-4 text-2xl font-semibold text-ink">
              The institution behind the teacher
            </h2>
            <p className="mt-4">
              {brand.name} carries {founder.name}&rsquo;s own initials, and
              that&rsquo;s deliberate — the credibility here comes from a
              practising cardiologist willing to put his name behind every
              course. But carrying a founder&rsquo;s name doesn&rsquo;t mean
              depending on one. Courses, curricula, and quality standards are
              built to stand on their own — designed once, taught
              consistently, and eventually delivered by a wider faculty —
              rather than depending entirely on any one person in the room.
              The goal is an academy learners can trust independent of who
              happens to be teaching a given session, built on a foundation
              that one experienced, practising cardiologist laid first.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
