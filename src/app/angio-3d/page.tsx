import type { Metadata } from "next";
import { Compass, Crosshair, Gauge, RotateCw } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal, StaggerGroup } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { AngioView3D } from "@/components/ui/AngioView3D";
import { brand } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "3D Angiography Views",
  description: `Move a virtual C-arm around a 3D coronary tree and see how each angiographic view foreshortens the vessels. A free teaching tool from ${brand.name}.`,
};

const features = [
  { icon: RotateCw, title: "Move the C-arm", text: "Drag the model or use the LAO/RAO and cranial/caudal sliders." },
  { icon: Gauge, title: "See foreshortening", text: "Every segment is coloured and scored for how clearly this view shows it." },
  { icon: Crosshair, title: "Find the best view", text: "Pick a segment and jump straight to the angle that shows it best." },
  { icon: Compass, title: "Learn standard views", text: "One tap to AP, RAO cranial, LAO cranial, Spider, lateral and more." },
];

export default function Angio3DPage() {
  return (
    <>
      <PageHero
        eyebrow="Cath Lab"
        title="3D angiography views"
        description="Rotate the C-arm around a 3D coronary tree and see which views show each vessel clearly and which hide it."
      >
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="#simulator" variant="gold" size="lg">
            Start exploring
          </Button>
          <Button href="/cath-lab-cheat-sheet" variant="gold" size="lg">
            Views cheat sheet
          </Button>
        </div>
      </PageHero>

      <section id="simulator" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-12 sm:px-8 sm:py-16">
        <AngioView3D />
      </section>

      <section className="bg-royal-50 px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="text-center text-2xl font-semibold text-royal-950 sm:text-3xl">How to use it</h2>
          </Reveal>
          <StaggerGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-royal-200 bg-white p-6">
                <Icon className="size-6 text-gold-500" aria-hidden="true" />
                <h3 className="mt-3 font-semibold text-royal-950">{title}</h3>
                <p className="mt-1 text-sm text-royal-800">{text}</p>
              </div>
            ))}
          </StaggerGroup>
          <p className="mt-10 text-center text-xs text-royal-700">
            A schematic model for teaching. Real anatomy varies between patients, so the best view for a given patient is always found on live
            fluoroscopy. Not for clinical decision-making.
          </p>
        </div>
      </section>
    </>
  );
}
