import type { Metadata } from "next";
import { Activity, Boxes, ListChecks } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal, StaggerGroup } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { CourseCrossLink, ToolFrame } from "@/components/ui/ToolShowcase";
import { brand } from "@/lib/site-data";
import { cathLabTools } from "@/lib/tools-data";

export const metadata: Metadata = {
  title: "Cath Lab",
  description: `Cath Lab by ${brand.name}: a virtual coronary angiography simulator, a searchable cath lab equipment library and step-by-step procedure overviews.`,
};

const icons = [Activity, Boxes, ListChecks];

export default function CathLabPage() {
  return (
    <>
      <PageHero
        eyebrow="Cath Lab"
        title="Learn the cath lab by seeing it"
        description="A virtual angiography simulator, the equipment used in the lab and the steps of each procedure, in one place."
      >
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/cath-sim/" variant="gold" size="lg">
            Launch Simulator
          </Button>
        </div>
      </PageHero>

      <ToolFrame
        src="/cath-sim/"
        title="Cath Lab virtual angiography simulator"
        address="rrpcardio.com/cath-sim"
        fullHref="/cath-sim/"
        highlights={["3D heart and coronary tree", "C-arm angle control", "134 devices", "29 procedures"]}
      />

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <h2 className="mb-8 text-center font-heading text-3xl font-semibold text-ink">What&apos;s inside</h2>
        <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cathLabTools.map(({ title, text, href }, i) => {
            const Icon = icons[i];
            return (
              <a
                key={title}
                href={href}
                className="group block rounded-2xl border border-royal-100 bg-white p-7 transition hover:border-royal-400 hover:shadow-lg"
              >
                <Icon className="h-6 w-6 text-royal-700" aria-hidden="true" />
                <h2 className="mt-4 font-heading text-xl font-semibold text-ink">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-mist-700">{text}</p>
                <span className="mt-4 inline-block text-sm font-medium text-royal-800 group-hover:underline">
                  Open &rarr;
                </span>
              </a>
            );
          })}
        </StaggerGroup>

        <Reveal delay={0.1}>
          <p className="mx-auto mt-12 max-w-2xl text-center text-xs leading-relaxed text-mist-700">
            These tools are educational summaries and have not yet been reviewed by a cardiologist.
            Device availability and technique vary by institution, so always follow the
            manufacturer&apos;s instructions and local protocols. Anatomy: BodyParts3D, © The
            Database Center for Life Science, licensed under CC Attribution 4.0 International.
          </p>
        </Reveal>

        <div className="mt-16">
          <CourseCrossLink
            title="Learn the theory behind the images"
            text="Our Cath Lab courses cover access, angiographic views, devices and procedures, with this simulator for practice."
            href="/courses/cath-lab"
            cta="View Cath Lab courses"
          />
        </div>

        <Reveal delay={0.15}>
          <div className="mt-16 flex flex-col items-center gap-5 rounded-2xl border border-royal-100 bg-royal-50 p-10 text-center">
            <p className="font-heading text-xl font-semibold text-ink">Also try ECG Mastery</p>
            <p className="max-w-lg text-sm text-mist-700">
              A 12-lead ECG simulator, a library of ECG topics and a quiz, from the same academy.
            </p>
            <Button href="/ecg-mastery">Open ECG Mastery</Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
