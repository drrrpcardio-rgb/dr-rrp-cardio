import Link from "next/link";
import { Plus } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const homeFaqs = [
  {
    q: "Are the simulators really free?",
    a: "Yes. The echo simulator, ECG simulator, cath lab and echo calculators all run free in your browser, with no sign-up. Your progress is saved on your own device.",
  },
  {
    q: "Who are the courses for?",
    a: "Doctors, postgraduates, nurses, and cath lab and echo technicians. Each track starts from systematic basics and builds to confident, case-based interpretation.",
  },
  {
    q: "Are courses live or recorded?",
    a: "It depends on the module: most combine recorded lessons with live teaching. Scheduled live batches and workshops are listed on the Live Classes and Workshops pages.",
  },
  {
    q: "Do I get a certificate?",
    a: "A Certificate of Completion is issued when you finish all modules of a course and its assessment. Live classes and workshops earn a Certificate of Participation.",
  },
  {
    q: "Can I use the simulators on my phone?",
    a: "Yes. They work on phones and tablets; for the echo simulator, use full screen for the most room. A laptop gives the best experience for long practice sessions.",
  },
  {
    q: "Where can I see real cases?",
    a: "The Case Files on our blog walk through real, anonymised cases from the cath lab: the ECG, the echo and the angiogram, with the lessons and a short self-test.",
  },
  {
    q: "How do I enrol?",
    a: "Send an enquiry through the contact page with the course you are interested in. The team replies by email with dates, fees and next steps.",
  },
];

export function HomeFAQ() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: homeFaqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <SectionHeading eyebrow="Questions" title="Frequently asked"
          accent="asked" description="Quick answers about the courses, simulators and certificates." />
          <p className="mt-6 text-sm text-mist-700">
            Something else?{" "}
            <Link href="/contact" className="font-semibold text-royal-700 underline-offset-2 hover:underline">
              Ask us directly
            </Link>
            .
          </p>
        </div>
        <div className="divide-y divide-mist-200 border-y border-mist-200">
          {homeFaqs.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-heading text-lg font-semibold text-ink marker:hidden focus-visible:outline-2 focus-visible:outline-royal-500 [&::-webkit-details-marker]:hidden">
                {f.q}
                <Plus size={20} className="shrink-0 text-gold-600 transition-transform duration-300 group-open:rotate-45" aria-hidden="true" />
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mist-700">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
