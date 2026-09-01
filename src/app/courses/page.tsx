import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
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
        <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courseCategories.map((c) => (
            <CourseCategoryCard key={c.slug} slug={c.slug} />
          ))}
        </StaggerGroup>
      </section>
    </>
  );
}
