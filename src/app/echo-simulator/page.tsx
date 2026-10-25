import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { Button } from "@/components/ui/Button";
import { brand } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Echo Simulator",
  description: `Scan a 3D heart with a virtual probe and see a realistic transthoracic echo image: 15 views, colour, PW, CW and tissue Doppler, M-mode, measurements and 22 pathology cases. Free from ${brand.name}.`,
};

const features = [
  { title: "Realistic 2D image", text: "Beam model with speckle, harmonics, attenuation, dropout and lung shadowing, like a real scanner." },
  { title: "15 standard views", text: "Parasternal, apical, subcostal and suprasternal windows. Drag the probe or jump to a view." },
  { title: "Full Doppler", text: "Colour flow with aliasing, PW, CW and tissue Doppler, with auto trace and gradients." },
  { title: "22 pathology cases", text: "AS, MS, HOCM, tamponade, DCM, amyloid, PE and more, with a quiz and an echo report." },
];

export default function EchoSimulatorPage() {
  return (
    <>
      <PageHero
        eyebrow="Echo"
        title="Echo simulator"
        description="Move the probe on a 3D patient and scan the heart as you would in the echo lab: 2D, M-mode, colour and spectral Doppler, measurements and cases."
      >
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="#lab" variant="gold" size="lg">
            Start scanning
          </Button>
          <Button href="/echo-lab/index.html" variant="gold" size="lg">
            Open full screen
          </Button>
        </div>
      </PageHero>

      <section id="lab" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-10 sm:px-8 sm:py-14">
        <div className="h-[88vh] min-h-[640px] w-full overflow-hidden rounded-3xl border border-royal-200 bg-royal-950 shadow-2xl lg:h-[900px]">
          <iframe
            src="/echo-lab/index.html"
            title="Dr. RRP Cardio Echo Lab"
            allow="fullscreen; clipboard-write"
            allowFullScreen
            className="size-full border-0"
          />
        </div>
        <p className="mt-4 text-center text-sm text-royal-700">
          Drag the probe on the chest, or pick a view under the 3D model. Click inside the simulator to use the keyboard: arrows slide, Q/E
          rotate, W/S fan, Space freezes. On a phone, use <a href="/echo-lab/index.html" className="font-semibold underline">full screen</a>.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-royal-100 bg-white p-5 shadow-sm">
              <h2 className="font-heading text-lg font-semibold text-royal-900">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{f.text}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-royal-700">
          Simulated images from a simplified heart model, for teaching only. Not real patient data and not for clinical decision-making.
        </p>
      </section>
    </>
  );
}
