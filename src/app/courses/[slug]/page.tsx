import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui/PageHero";
import { StaggerGroup } from "@/components/ui/Reveal";
import { ModuleCard } from "@/components/courses/ModuleCard";
import { courseCategories, getCourseCategory } from "@/lib/courses-data";

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

  return (
    <>
      <PageHero eyebrow={course.shortName} title={course.name} description={course.description} />
      <section className="mx-auto max-w-4xl px-5 py-20 sm:px-8">
        <StaggerGroup className="flex flex-col gap-5">
          {course.modules.map((mod) => (
            <ModuleCard key={mod.name} module={mod} />
          ))}
        </StaggerGroup>
      </section>
    </>
  );
}
