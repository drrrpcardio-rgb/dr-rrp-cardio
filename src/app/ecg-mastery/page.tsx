import type { Metadata } from "next";
import { Activity, Award, BookOpen, MapPin } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal, StaggerGroup } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { CourseCrossLink, ToolFrame } from "@/components/ui/ToolShowcase";
import { brand } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "ECG Mastery",
  description: `ECG Mastery by ${brand.name}: an ECG library, a 12-lead ECG machine simulator, lead placement practice and a quiz.`,
};

const SIMULATOR_URL = "/ecg-simulator/";

const sections = [
  {
    icon: BookOpen,
    title: "ECG Library",
    text: "111 topics covering rhythms, blocks, ischaemia, electrolytes and pacing, each with criteria, pitfalls and a live example.",
    href: `${SIMULATOR_URL}#library`,
  },
  {
    icon: Activity,
    title: "ECG Machine",
    text: "A live 12-lead simulator with 97 presets. Adjust rate, intervals, ST and pacing and watch every lead respond.",
    href: `${SIMULATOR_URL}#machine`,
  },
  {
    icon: MapPin,
    title: "Lead Placement",
    text: "Practise placing all 12 electrodes on the chest and limbs, with feedback on accuracy.",
    href: `${SIMULATOR_URL}#placement`,
  },
  {
    icon: Award,
    title: "Quiz",
    text: "116 questions on rhythm recognition, intervals, axis and infarct territories, with explanations.",
    href: `${SIMULATOR_URL}#quiz`,
  },
];

export default function EcgMasteryPage() {
  return (
    <>
      <PageHero
        eyebrow="ECG Mastery"
        title="Learn ECGs by seeing them"
        description="An ECG library, a live 12-lead ECG machine, lead placement practice and a quiz, in one place."
      >
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href={`${SIMULATOR_URL}#machine`} variant="gold" size="lg">
            Launch Simulator
          </Button>
        </div>
      </PageHero>

      <ToolFrame
        src={`${SIMULATOR_URL}#machine`}
        title="ECG Mastery simulator"
        address="rrpcardio.com/ecg-simulator"
        fullHref={SIMULATOR_URL}
        highlights={["97 ECG presets", "111 library topics", "12-lead lead placement", "116-question quiz"]}
      />

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <h2 className="mb-8 text-center font-heading text-3xl font-semibold text-ink">What&apos;s inside</h2>
        <StaggerGroup className="grid gap-6 sm:grid-cols-2">
          {sections.map(({ icon: Icon, title, text, href }) => (
            <a
              key={title}
              href={href}
              className="group block rounded-2xl border border-royal-100 bg-white p-7 transition hover:border-royal-400 hover:shadow-lg"
            >
              <Icon className="h-6 w-6 text-royal-700" aria-hidden="true" />
              <h2 className="mt-4 font-heading text-xl font-semibold text-ink">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-mist-700">{text}</p>
              <span className="mt-4 inline-block text-sm font-medium text-royal-800 group-hover:underline">
                Open {title} &rarr;
              </span>
            </a>
          ))}
        </StaggerGroup>

        <div className="mt-16 flex flex-col items-start gap-4 rounded-2xl border border-gold-200 bg-gold-50 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-heading text-xl font-semibold text-ink">Free ECG Cheat Sheet</p>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-mist-700">
              Read any 12-lead ECG in 6 steps, then the patterns to recognise. Read it online or download the PDF.
            </p>
          </div>
          <Button href="/ecg-cheat-sheet" variant="gold">Open the cheat sheet</Button>
        </div>

        <div className="mt-8">
          <CourseCrossLink
            title="Want structured teaching?"
            text={`The simulator pairs with the ${brand.coursePrefix} ECG courses, which take you from fundamentals to advanced interpretation.`}
            href="/courses/ecg"
            cta="View ECG courses"
          />
        </div>

        <Reveal delay={0.2}>
          <p className="mt-10 text-center text-sm text-mist-700">
            Also from {brand.name}: the{" "}
            <a className="font-medium text-royal-800 underline" href="/cath-lab">
              Cath Lab simulator, equipment library and procedures
            </a>
            .
          </p>
        </Reveal>
      </section>
    </>
  );
}
