import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { Button } from "@/components/ui/Button";
import { EchoLabFrame } from "@/components/ui/EchoLabFrame";
import { brand } from "@/lib/site-data";

const description = `A free 3D transoesophageal echo (TEE) simulator from ${brand.name}: advance, turn and flex the probe in the oesophagus and stomach, rotate the 0–180° multiplane, and see a realistic TEE image in 21 standard views with colour, PW, CW and tissue Doppler, a bubble study and 17 cases.`;

export const metadata: Metadata = {
  title: "TEE Simulator",
  description,
};

const features = [
  { title: "Real probe controls", text: "Drag the big and small wheels, the multiplane dial, the turn dial and the insertion ruler, or hold the buttons, and watch the tip bend as you go." },
  { title: "21 standard views", text: "Mid-oesophageal, transgastric, deep transgastric, aortic and upper oesophageal views from the ASE/SCA comprehensive TEE exam." },
  { title: "Full Doppler", text: "Colour flow with aliasing, PW, CW and tissue Doppler with sound, plus an agitated saline bubble study for shunts." },
  { title: "17 TEE cases", text: "LAA thrombus, flail mitral leaflet, endocarditis, ASD, PFO, aortic dissection, tamponade and more, with a quiz and a report." },
];

const views = [
  { group: "Mid-oesophageal", list: "4 chamber, 5 chamber, mitral commissural, 2 chamber, long axis, AV short and long axis, RV inflow–outflow, bicaval, LAA, ascending aorta short and long axis" },
  { group: "Transgastric", list: "Basal and mid short axis, 2 chamber, long axis and deep transgastric" },
  { group: "Aorta", list: "Descending aorta short and long axis, upper oesophageal arch long and short axis" },
];

const cases = [
  "Normal TEE study",
  "Atrial fibrillation with LAA thrombus",
  "Flail posterior mitral leaflet with severe MR",
  "Infective endocarditis with mitral vegetation",
  "Secundum atrial septal defect",
  "Patent foramen ovale with a positive bubble study",
  "Type A aortic dissection",
  "Complex atheroma of the descending aorta",
  "Severe calcific aortic stenosis",
  "Severe chronic aortic regurgitation",
  "Rheumatic mitral stenosis with smoke",
  "Hypertrophic obstructive cardiomyopathy",
  "Post-operative effusion with tamponade",
  "Severe hypovolaemia",
  "Inferior myocardial infarction",
  "Left atrial myxoma",
  "Dilated cardiomyopathy with functional MR",
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Dr. RRP Cardio TEE Simulator",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any (web browser)",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  description,
  provider: { "@type": "Organization", name: brand.name },
  educationalUse: "Transoesophageal echocardiography training",
};

export default function TeeSimulatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHero
        eyebrow="TEE"
        title="Transoesophageal echo simulator"
        description="Pass a virtual TEE probe down the oesophagus of a 3D patient and build the standard views yourself: depth, turn, flexion and multiplane angle, with Doppler, a bubble study and cases."
      >
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="#lab" variant="gold" size="lg">
            Start scanning
          </Button>
          <Button href="/tee-lab/index.html" variant="gold" size="lg">
            Open full screen
          </Button>
        </div>
      </PageHero>

      <section id="lab" className="mx-auto max-w-7xl scroll-mt-24 px-3 py-8 sm:px-8 sm:py-14">
        <EchoLabFrame src="/tee-lab/index.html" title="Dr. RRP Cardio TEE Lab" loadingText="Loading the TEE lab…" />
        <p className="mt-4 text-center text-sm text-royal-700">
          Use the probe console in the simulator: the handle wheels, multiplane and turn dials, and the insertion ruler. You can also drag the
          probe along the oesophagus or pick a view under the 3D model. Click inside the simulator to use the keyboard: ↑/↓ withdraw and
          advance, ←/→ turn, W/S anteflex, A/D flex left and right, Q/E multiplane angle, N neutral tip, Space freezes.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-royal-100 bg-white p-5 shadow-sm">
              <h2 className="font-heading text-lg font-semibold text-royal-900">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{f.text}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-10 md:grid-cols-[1.4fr_1fr]">
          <div className="space-y-3 text-sm leading-relaxed text-ink-soft">
            <h2 className="font-heading text-xl font-semibold text-royal-950">Learn the TEE views before the first intubation</h2>
            <p>
              Each image is cut from a 3D heart, great vessels and stomach, so the probe behaves as it does in a patient. Advancing from the
              mid-oesophagus into the stomach changes the window, anteflexion restores contact with the gastric wall, and turning the
              multiplane walks the four chamber view through the commissural, two chamber and long axis views.
            </p>
            {views.map((v) => (
              <p key={v.group}>
                <span className="font-semibold text-royal-900">{v.group}: </span>
                {v.list}.
              </p>
            ))}
            <p>
              Practice mode scores how close your view is to the target and coaches you step by step: how far to advance, which way to turn,
              and where each wheel and the multiplane angle should be. Probe drills take you through 20 everyday manoeuvres, such as ME four
              chamber to two chamber or into the stomach for the transgastric views, and warn you if you move the probe with the tip still
              flexed. The case quiz asks for the diagnosis. Look for an LAA thrombus
              before cardioversion, grade mitral regurgitation, track a dissection flap down the aorta or run a saline contrast study across a
              PFO. For the transthoracic views, try the{" "}
              <Link href="/echo-simulator" className="font-semibold text-royal-700 underline-offset-2 hover:underline">
                echo simulator
              </Link>
              , and grade your measurements with the{" "}
              <Link href="/echo-calculators" className="font-semibold text-royal-700 underline-offset-2 hover:underline">
                echo calculators
              </Link>
              .
            </p>
          </div>
          <div className="rounded-2xl border border-royal-100 bg-white p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold text-royal-900">{cases.length} teaching cases</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
              {cases.map((c) => (
                <li key={c} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold-500" aria-hidden="true" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-royal-700">
          Simulated images from a simplified heart model, for teaching only. Not real patient data and not for clinical decision-making.
        </p>
      </section>
    </>
  );
}
