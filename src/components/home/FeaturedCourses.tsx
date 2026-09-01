import { SectionHeading } from "@/components/ui/SectionHeading";
import { StaggerGroup } from "@/components/ui/Reveal";
import { CourseCard } from "./CourseCard";
import { courseCategories } from "@/lib/courses-data";

export function FeaturedCourses() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
      <SectionHeading
        eyebrow="Curriculum"
        title="Featured courses"
        description="Five focused tracks, each built around structured interpretation and real clinical cases."
      />
      <StaggerGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courseCategories.map((course) => (
          <CourseCard key={course.slug} slug={course.slug} />
        ))}
      </StaggerGroup>
    </section>
  );
}
