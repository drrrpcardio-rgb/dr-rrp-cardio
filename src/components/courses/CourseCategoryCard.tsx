import { CourseCard } from "@/components/home/CourseCard";

/** The courses page uses the same card as the home page, as the page's main list (h2) with module counts. */
export function CourseCategoryCard({ slug, className }: { slug: string; className?: string }) {
  return <CourseCard slug={slug} className={className} headingLevel="h2" showModules />;
}
