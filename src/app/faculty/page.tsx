import type { Metadata } from "next";
import Image from "next/image";
import { UserPlus } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { brand, founder } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Faculty",
  description: `Meet the faculty of ${brand.name}.`,
};

export default function FacultyPage() {
  return (
    <>
      <PageHero
        eyebrow="Faculty"
        title="Taught by practitioners"
        description={`${brand.name}'s teaching is led by clinicians who still work the cases they teach.`}
      />

      <section className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
        <div className="grid gap-8 sm:grid-cols-2">
          <Reveal>
            <div className="overflow-hidden rounded-2xl border border-mist-200 bg-white shadow-sm">
              <div className="relative aspect-[4/5] w-full bg-mist-100">
                <Image
                  src="/images/founder-portrait-2.jpg"
                  alt={`${founder.name}, ${founder.role}, ${brand.name}`}
                  fill
                  priority
                  sizes="(max-width: 768px) 90vw, 460px"
                  className="object-cover object-top"
                />
              </div>
              <div className="p-7">
                <h2 className="font-heading text-xl font-semibold text-ink">{founder.name}</h2>
                <p className="mt-1 text-sm font-medium text-royal-700">{founder.role}</p>
                <p className="mt-0.5 text-sm text-mist-700">
                  {founder.title} &middot; {founder.credentials}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-mist-700">
                  {founder.name} founded {brand.name} to teach ECG,
                  echocardiography, and cath lab fundamentals through a
                  structured, case-based method — the same approach used at
                  the bedside, brought into the classroom.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-mist-300 bg-mist-50 p-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-royal-50 text-royal-700">
                <UserPlus size={26} strokeWidth={1.75} />
              </span>
              <p className="mt-5 font-heading text-lg font-semibold text-ink-soft">
                More faculty joining soon
              </p>
              <p className="mt-2 max-w-xs text-sm text-mist-600">
                As {brand.name} grows, additional faculty across ECG, Echo, Cath
                Lab, IVUS, and Interventional Cardiology will be introduced
                here.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
