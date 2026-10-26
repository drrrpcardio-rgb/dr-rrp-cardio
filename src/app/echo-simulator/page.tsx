import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { Button } from "@/components/ui/Button";
import { EchoLabFrame } from "@/components/ui/EchoLabFrame";
import { brand } from "@/lib/site-data";

const description = `Scan a 3D heart with a virtual probe and see a realistic transthoracic echo image: 16 views, colour, PW, CW and tissue Doppler, M-mode, measurements and 22 pathology cases. Free from ${brand.name}.`;

export const metadata: Metadata = {
  title: "Echo Simulator",
  description,
};

const features = [
  { title: "Realistic 2D image", text: "Beam model with speckle, harmonics, attenuation, dropout and lung shadowing, like a real scanner." },
  { title: "16 echo views", text: "Parasternal, apical, subcostal and suprasternal windows. Drag the probe or jump to a view." },
  { title: "Full Doppler", text: "Colour flow with aliasing, PW, CW and tissue Doppler, with auto trace and gradients." },
  { title: "22 pathology cases", text: "AS, MS, HOCM, tamponade, DCM, amyloid, PE and more, with a quiz and an echo report." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Dr. RRP Cardio Echo Simulator",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any (web browser)",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  description,
  provider: { "@type": "Organization", name: brand.name },
  educationalUse: "Echocardiography training",
};

export default function EchoSimulatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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

      <section id="lab" className="mx-auto max-w-7xl scroll-mt-24 px-3 py-8 sm:px-8 sm:py-14">
        <EchoLabFrame />
        <p className="mt-4 text-center text-sm text-royal-700">
          Drag the probe on the chest, or pick a view under the 3D model. Click inside the simulator to use the keyboard: arrows slide, Q/E
          rotate, W/S fan, Space freezes. Use the button in the corner for full screen.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-royal-100 bg-white p-5 shadow-sm">
              <h2 className="font-heading text-lg font-semibold text-royal-900">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{f.text}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-3xl space-y-3 text-sm leading-relaxed text-ink-soft">
          <h2 className="font-heading text-xl font-semibold text-royal-950">Learn transthoracic echo before you touch a patient</h2>
          <p>
            The simulator builds each image from a 3D heart, so moving the probe changes the cut just as it would on a real scanner. Practise
            finding the parasternal long and short axis, apical four, five and two chamber, subcostal and suprasternal views, then switch on
            colour or spectral Doppler to measure gradients and valve areas.
          </p>
          <p>
            Practice mode scores how close your view is to the target, and the case quiz asks you to name the diagnosis from the images. Your
            progress is kept in this browser. When you have a measurement, grade it with the{" "}
            <Link href="/echo-calculators" className="font-semibold text-royal-700 underline-offset-2 hover:underline">
              echo calculators
            </Link>
            .
          </p>
        </div>

        <p className="mt-10 text-center text-xs text-royal-700">
          Simulated images from a simplified heart model, for teaching only. Not real patient data and not for clinical decision-making.
        </p>
      </section>
    </>
  );
}
