import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { Button } from "@/components/ui/Button";
import { EchoLabFrame } from "@/components/ui/EchoLabFrame";
import { brand } from "@/lib/site-data";

const description = `A free cardiac CT and CT coronary angiography simulator from ${brand.name}: control heart rate, plan the scan, score calcium, time the contrast bolus, then read MPR, curved MPR and 3D images and write a CAD-RADS 2.0 report.`;

export const metadata: Metadata = {
  title: "CT Simulator",
  description,
};

const steps = [
  { title: "Plan", text: "Heart rate control, scanner, kV, mAs, ECG gating and the scan range on a topogram, with live dose and motion estimates." },
  { title: "Calcium score", text: "Non-contrast 3 mm slices. Click each calcium to assign it to an artery and build the Agatston score." },
  { title: "Contrast", text: "Set rate, volume and trigger, watch the bolus-tracking curve and see how timing changes enhancement." },
  { title: "Read", text: "Axial, coronal and sagittal MPR, a straightened CPR with lumen profile, cross-sections and 3D views." },
  { title: "Report", text: "Grade each artery, give the CAD-RADS category, plaque burden and modifiers, then check your answer." },
];

const cases = [
  "Normal coronaries",
  "Non-calcified proximal LAD stenosis",
  "Heavy multivessel calcification",
  "High-risk plaque",
  "RCA chronic total occlusion",
  "Myocardial bridge",
  "Anomalous RCA from the left sinus",
  "Patent LAD stent",
  "Left main disease",
  "Fast heart rate with ectopics",
  "Minimal plaque",
  "Non-obstructive high-risk plaque in the RCA",
  "High BMI and image noise",
  "Moderate LCx stenosis",
  "LAD–diagonal bifurcation lesion",
  "Three-vessel disease",
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Dr. RRP Cardio CT Simulator",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any (web browser)",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  description,
  provider: { "@type": "Organization", name: brand.name },
  educationalUse: "Cardiac CT and CT coronary angiography training",
};

export default function CtSimulatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHero
        eyebrow="Cardiac CT"
        title="CT coronary angiography simulator"
        description="Run a cardiac CT from the scanner console to the report: plan, score calcium, track the bolus, then read the coronary arteries in MPR, curved MPR and 3D."
      >
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="#lab" variant="gold" size="lg">
            Start the scan
          </Button>
          <Button href="/ct-lab/index.html" variant="gold" size="lg">
            Open full screen
          </Button>
        </div>
      </PageHero>

      <section id="lab" className="mx-auto max-w-7xl scroll-mt-24 px-3 py-8 sm:px-8 sm:py-14">
        <EchoLabFrame src="/ct-lab/index.html" title="Dr. RRP Cardio CT Lab" loadingText="Loading the CT lab…" />
        <p className="mt-4 text-center text-sm text-royal-700">
          Work through the five steps on the left, or press Skip to reading for an ideal scan. In the reader, click the CPR to move along the
          artery, drag the 3D view to rotate, and right-drag any image to change the window.
        </p>

        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-royal-100 bg-white p-5 shadow-sm">
              <span className="flex size-8 items-center justify-center rounded-full bg-gold-400 text-sm font-bold text-royal-950">{i + 1}</span>
              <h2 className="mt-3 font-heading text-lg font-semibold text-royal-900">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>

        <div className="mx-auto mt-12 grid max-w-5xl gap-10 md:grid-cols-[1.4fr_1fr]">
          <div className="space-y-3 text-sm leading-relaxed text-ink-soft">
            <h2 className="font-heading text-xl font-semibold text-royal-950">Learn what changes a CCTA</h2>
            <p>
              Every image is built from a 3D model of the chest and heart, so your choices on the console change what you see. A fast heart
              rate blurs the RCA, a late trigger leaves the coronaries faint, low kV raises the noise, and cutting the scan range short loses
              the left main or the distal vessels. The plan panel shows the expected dose and motion before you scan.
            </p>
            <p>
              Then read the study the way a reporting cardiologist does: follow each artery on the curved MPR, rotate it to see eccentric
              plaque, check the cross-section and lumen profile, and use a wide window to cut through calcium and stent blooming. Finish with
              a structured CAD-RADS 2.0 report and see where you were right. Pair it with the{" "}
              <Link href="/cath-lab" className="font-semibold text-royal-700 underline-offset-2 hover:underline">
                virtual cath lab
              </Link>{" "}
              to compare CT with invasive angiography.
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
          Simulated images from a synthetic heart model, for teaching only. Not real patient data and not for clinical decision-making.
        </p>
      </section>
    </>
  );
}
