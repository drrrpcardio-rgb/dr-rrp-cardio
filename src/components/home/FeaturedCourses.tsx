import { SectionHeading } from "@/components/ui/SectionHeading";
import { StaggerGroup } from "@/components/ui/Reveal";
import { CourseCard } from "./CourseCard";
import { courseCategories } from "@/lib/courses-data";

export function FeaturedCourses() {
  return (
    <section className="section-tint overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
      <SectionHeading
        eyebrow="Curriculum"
        title="Featured courses"
          accent="courses"
        description="Five focused tracks, each built around structured interpretation and real clinical cases."
      />
      <StaggerGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
        {courseCategories.map((course, i) => (
          // Five cards: three on the first row, two wider ones on the second, so no gap is left
          <CourseCard key={course.slug} slug={course.slug} className={i < 3 ? "lg:col-span-2" : "lg:col-span-3"} />
        ))}
      </StaggerGroup>
      </div>
    </section>
  );
}
