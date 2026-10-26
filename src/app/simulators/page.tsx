import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { Button } from "@/components/ui/Button";
import { simulators } from "@/lib/tools-data";
import { brand } from "@/lib/site-data";

const description = `Free cardiology simulators and tools from ${brand.name}: a 3D echo simulator, a 12-lead ECG simulator, a virtual cath lab and 30 graded echo calculators. Practise in your browser.`;

export const metadata: Metadata = {
  title: "Simulators",
  description,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: `${brand.name} simulators and tools`,
  itemListElement: simulators.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: s.title, url: s.href })),
};

const steps = [
  { title: "Learn the theory", text: "Take a course or read a cheat sheet to understand what you are looking for." },
  { title: "Practise on the simulator", text: "Find the views, trace the rhythms and measure the gradients until it feels natural." },
  { title: "Check your numbers", text: "Grade your measurements with the calculators against current guidelines." },
];

export default function SimulatorsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHero
        eyebrow="Free simulation lab"
        title="Practise cardiology hands-on"
        description="Echo, ECG and cath lab simulators plus echo calculators. Free, in your browser, no sign-up."
      >
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/echo-simulator" variant="gold" size="lg">
            Start with echo
          </Button>
          <Button href="/courses" variant="gold" size="lg">
            Browse courses
          </Button>
        </div>
      </PageHero>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {simulators.map((s) => (
            <Link
              key={s.id}
              href={s.href}
              className={`group flex flex-col overflow-hidden rounded-3xl ${s.id === "echo" ? "md:col-span-3 lg:grid lg:grid-cols-[1.3fr_1fr]" : ""} border border-royal-100 bg-white shadow-sm transition-shadow hover:shadow-xl`}
            >
              {s.image ? (
                <div className={`relative aspect-[16/10] overflow-hidden bg-royal-950 ${s.id === "echo" ? "lg:aspect-auto lg:min-h-[380px]" : ""}`}>
                  <Image src={s.image} alt={`${s.title} screenshot`} fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]" />
                </div>
              ) : (
                <div className="h-2 bg-gradient-to-r from-royal-700 via-royal-500 to-gold-400" />
              )}
              <div className="flex flex-1 flex-col p-7">
                <p className="text-xs font-semibold tracking-widest text-gold-700 uppercase">{s.tag}</p>
                <h2 className="mt-2 font-heading text-2xl font-semibold text-royal-950">{s.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{s.text}</p>
                <ul className="mt-4 flex-1 space-y-1.5 text-sm text-ink-soft">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-center gap-2">
                      <Check size={15} className="text-gold-500" aria-hidden="true" /> {p}
                    </li>
                  ))}
                </ul>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-royal-700">
                  Open {s.title}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 rounded-3xl bg-royal-950 p-8 text-white sm:p-12">
          <h2 className="font-heading text-2xl font-semibold sm:text-3xl">How to use the lab</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title}>
                <span className="flex size-9 items-center justify-center rounded-full bg-gold-400 font-bold text-royal-950">{i + 1}</span>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-royal-100">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-10 text-center text-xs text-royal-700">Simulated data for teaching only. Not for clinical decision-making.</p>
      </section>
    </>
  );
}
