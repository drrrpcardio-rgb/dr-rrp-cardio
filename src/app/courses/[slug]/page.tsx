import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui/PageHero";
import { StaggerGroup } from "@/components/ui/Reveal";
import { ModuleCard } from "@/components/courses/ModuleCard";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { courseCategories, getCourseCategory } from "@/lib/courses-data";
import { simulators } from "@/lib/tools-data";

// The free simulators that pair with each course track
const PRACTICE: Record<string, string[]> = {
  ecg: ["ecg"],
  echo: ["echo", "calc"],
  "cath-lab": ["cath"],
  ivus: ["cath"],
  "interventional-cardiology": ["cath", "ecg"],
};

export function generateStaticParams() {
  return courseCategories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourseCategory(slug);
  if (!course) return {};
  return {
    title: course.name,
    description: course.description,
  };
}

export default async function CourseCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = getCourseCategory(slug);
  if (!course) notFound();
  const practice = (PRACTICE[course.slug] ?? []).map((id) => simulators.find((t) => t.id === id)!).filter(Boolean);

  return (
    <>
      <PageHero eyebrow={course.shortName} title={course.name} description={course.description} />
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_340px]">
        <div>
          <h2 className="mb-6 font-heading text-2xl font-semibold text-ink">
            {course.modules.length} {course.modules.length === 1 ? "module" : "modules"}
          </h2>
          <StaggerGroup className="flex flex-col gap-5">
            {course.modules.map((mod) => (
              <ModuleCard key={mod.name} module={mod} />
            ))}
          </StaggerGroup>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <p className="text-xs font-semibold tracking-[0.2em] text-gold-700 uppercase">Practise alongside, free</p>
          {practice.map((t) => (
            <Link key={t.id} href={t.href} className="group block overflow-hidden rounded-3xl border border-mist-200 bg-white transition-shadow hover:shadow-xl">
              <div className="relative aspect-[16/10] overflow-hidden bg-royal-950">
                <Image src={t.image} alt={`${t.title} screenshot`} fill sizes="340px" className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]" />
              </div>
              <div className="p-5">
                <h3 className="font-heading text-lg font-semibold text-ink">{t.title}</h3>
                <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-royal-700">
                  Open <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </aside>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-royal-950 p-8 text-white sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="font-heading text-2xl font-semibold sm:text-3xl">Interested in {course.name}?</h2>
            <p className="mt-2 max-w-xl text-sm text-royal-100">Send an enquiry and we&apos;ll reply with dates, fees and how to join the next batch.</p>
          </div>
          <Button href="/contact" variant="gold" size="lg">
            Enquire now
          </Button>
        </div>
      </section>
    </>
  );
}
