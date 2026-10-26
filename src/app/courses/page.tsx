import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { Button } from "@/components/ui/Button";
import { StaggerGroup } from "@/components/ui/Reveal";
import { CourseCategoryCard } from "@/components/courses/CourseCategoryCard";
import { courseCategories } from "@/lib/courses-data";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Structured cardiology courses in ECG, Echo, Cath Lab, IVUS and Interventional Cardiology.",
};

export default function CoursesPage() {
  return (
    <>
      <PageHero
        eyebrow="Curriculum"
        title="Courses"
        description="Five focused tracks. Pick the one that matches where you are today — each is built to take you from systematic basics to confident, case-tested interpretation."
      />
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
          {courseCategories.map((c, i) => (
            <CourseCategoryCard key={c.slug} slug={c.slug} className={i < 3 ? "lg:col-span-2" : "lg:col-span-3"} />
          ))}
        </StaggerGroup>

        <div className="mt-16 flex flex-col items-start justify-between gap-6 rounded-3xl bg-royal-950 p-8 text-white sm:flex-row sm:items-center sm:p-10">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-gold-300 uppercase">Free simulation lab</p>
            <h2 className="mt-2 font-heading text-2xl font-semibold sm:text-3xl">Practise alongside any course</h2>
            <p className="mt-2 max-w-xl text-sm text-royal-100">Echo, ECG and cath lab simulators plus echo calculators, free in your browser.</p>
          </div>
          <Button href="/simulators" variant="gold" size="lg">
            Open the simulators
          </Button>
        </div>
      </section>
    </>
  );
}
