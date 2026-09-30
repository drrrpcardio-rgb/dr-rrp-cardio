import type { Metadata } from "next";
import { Activity, BookOpenCheck, Gauge, Layers } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal, StaggerGroup } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { brand } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "ECG Mastery",
  description: `ECG Mastery by ${brand.name}: an interactive 12-lead ECG simulator for learning rhythms, morphology and interpretation.`,
};

const SIMULATOR_URL = "/ecg-simulator/";

const features = [
  {
    icon: Activity,
    title: "Live 12-lead simulation",
    text: "Rhythms, blocks, ischaemia, electrolyte and drug effects drawn from a cardiac vector model, on standard paper speed and gain.",
  },
  {
    icon: Layers,
    title: "Change one thing at a time",
    text: "Adjust rate, PR, QRS, axis, ST shift and pacing, and watch how every lead responds.",
  },
  {
    icon: BookOpenCheck,
    title: "Reference and practice",
    text: "A clinical library with diagnostic criteria, plus quizzes and cases to test your interpretation.",
  },
  {
    icon: Gauge,
    title: "Works on any device",
    text: "Runs in the browser and can be installed like an app, including for offline revision.",
  },
];

export default function EcgMasteryPage() {
  return (
    <>
      <PageHero
        eyebrow="ECG Mastery"
        title="Learn ECGs by seeing them"
        description="An interactive 12-lead ECG simulator and training platform for students, residents, nurses, paramedics and clinicians."
      >
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href={SIMULATOR_URL} variant="gold" size="lg">
            Launch Simulator
          </Button>
        </div>
      </PageHero>

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <StaggerGroup className="grid gap-6 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-royal-100 bg-white p-7">
              <Icon className="h-6 w-6 text-royal-700" aria-hidden="true" />
              <h2 className="mt-4 font-heading text-xl font-semibold text-ink">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-mist-700">{text}</p>
            </div>
          ))}
        </StaggerGroup>

        <Reveal delay={0.1}>
          <div className="mt-16 overflow-hidden rounded-2xl border border-royal-100 bg-royal-950">
            <iframe
              src={SIMULATOR_URL}
              title="ECG Mastery simulator"
              loading="lazy"
              className="h-[80vh] min-h-[560px] w-full"
            />
          </div>
          <p className="mt-3 text-center text-xs text-mist-700">
            Prefer more room?{" "}
            <a className="font-medium text-royal-800 underline" href={SIMULATOR_URL}>
              Open the simulator full screen
            </a>
            .
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-16 flex flex-col items-center gap-5 rounded-2xl border border-royal-100 bg-royal-50 p-10 text-center">
            <p className="font-heading text-xl font-semibold text-ink">Want structured teaching?</p>
            <p className="max-w-lg text-sm text-mist-700">
              The simulator pairs with the {brand.coursePrefix} ECG courses, which take you from
              fundamentals to advanced interpretation.
            </p>
            <Button href="/courses/ecg">View ECG Courses</Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
