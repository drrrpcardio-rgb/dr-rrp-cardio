import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { Button } from "@/components/ui/Button";
import { EchoCalculators } from "@/components/ui/EchoCalculators";
import { CALCS } from "@/lib/echo-calculators";
import { brand } from "@/lib/site-data";

const description = `${CALCS.length} free echocardiography calculators with guideline grading: chamber size, LV mass, EF, GLS, aortic stenosis, prosthetic valves, MR and TR, RVSP, TAPSE/PASP, diastolic function, Qp:Qs and more. From ${brand.name}.`;

export const metadata: Metadata = {
  title: "Echo Calculators",
  description,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Dr. RRP Cardio Echo Calculators",
  applicationCategory: "MedicalApplication",
  operatingSystem: "Any (web browser)",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  description,
  provider: { "@type": "Organization", name: brand.name },
  featureList: CALCS.map((c) => c.title),
};

export default function EchoCalculatorsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHero
        eyebrow="Echo"
        title="Echo calculators"
        description="Enter your measurements and get the result graded against current ASE/EACVI and ACC/AHA cut-offs, with the formula and reference ranges beside it."
      >
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="#calculators" variant="gold" size="lg">
            Open calculators
          </Button>
          <Button href="/echo-simulator" variant="gold" size="lg">
            Echo simulator
          </Button>
        </div>
      </PageHero>

      <section id="calculators" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-10 sm:px-8 sm:py-14">
        <EchoCalculators />

        <div className="mx-auto mt-14 max-w-3xl space-y-3 text-sm leading-relaxed text-ink-soft">
          <h2 className="font-heading text-xl font-semibold text-royal-950">How to use these echo calculators</h2>
          <p>
            Enter the patient&apos;s height, weight and sex once at the top: the body surface area and sex then fill in every calculator that
            needs them. Each result is graded against guideline cut-offs, with the formula, the reference table and the source underneath, so
            you can check the working.
          </p>
          <p>
            Press <strong>Add to report</strong> to collect results from several calculators, then copy them into your report or print them.
            The patient details and report stay in this browser and are not sent anywhere. To practise getting the measurements in the first
            place, try the{" "}
            <Link href="/echo-simulator" className="font-semibold text-royal-700 underline-offset-2 hover:underline">
              echo simulator
            </Link>
            .
          </p>
        </div>

        <p className="mt-10 text-center text-xs text-royal-700">
          For education. Check every result against the full guideline and the clinical picture; not for clinical decision-making on its own.
        </p>
      </section>
    </>
  );
}
