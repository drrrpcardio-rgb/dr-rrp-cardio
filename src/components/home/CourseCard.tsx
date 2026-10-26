"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { courseCategories, getCourseCategory } from "@/lib/courses-data";
import { staggerItem } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

interface CourseCardProps {
  slug: string;
  className?: string;
  /** h3 inside a home-page section, h2 when the cards are the page's main list. */
  headingLevel?: "h2" | "h3";
  showModules?: boolean;
}

/** Course card: a dark header panel with the course icon and number, then the details. */
export function CourseCard({ slug, className, headingLevel = "h3", showModules = true }: CourseCardProps) {
  const course = getCourseCategory(slug);
  if (!course) return null;
  const Icon = course.icon;
  const number = String(courseCategories.findIndex((c) => c.slug === slug) + 1).padStart(2, "0");
  const Heading = headingLevel;

  return (
    <motion.div variants={staggerItem} className={className}>
      <Link
        href={`/courses/${course.slug}`}
        className="spotlight group relative flex h-full flex-col overflow-hidden rounded-3xl border border-mist-200 bg-white shadow-sm shadow-royal-900/5 transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-1.5 hover:border-gold-300 hover:shadow-2xl hover:shadow-royal-900/15"
      >
        {/* Header panel */}
        <div className="relative h-36 overflow-hidden bg-gradient-to-br from-royal-950 via-royal-900 to-royal-700">
          <div aria-hidden="true" className="bg-grid absolute inset-0 opacity-40" />
          <div aria-hidden="true" className="absolute -top-16 -right-10 size-48 rounded-full bg-gold-400/20 blur-3xl transition-opacity duration-500 group-hover:opacity-100 sm:opacity-60" />
          <svg aria-hidden="true" viewBox="0 0 400 60" preserveAspectRatio="none" className="absolute inset-x-0 bottom-3 h-10 w-full text-gold-400/35">
            <path
              d="M0 30h70l6-12 8 26 6-14h60c6-16 26-16 32 0h40l5 4 9-44 10 60 6-20h20c8-18 34-18 42 0h86"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <span aria-hidden="true" className="absolute top-3 right-5 font-heading text-6xl leading-none font-semibold text-white/10 transition-colors duration-300 group-hover:text-gold-300/25">
            {number}
          </span>
          <span className="absolute top-6 left-6 flex size-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-gold-300 shadow-lg backdrop-blur transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
            <Icon size={26} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <span className="absolute bottom-4 left-6 rounded-full bg-gold-400 px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-royal-950 uppercase">
            {course.shortName}
          </span>
        </div>

        {/* Details */}
        <div className="flex flex-1 flex-col p-7">
          <Heading className="font-heading text-xl font-semibold text-ink transition-colors group-hover:text-royal-700">{course.name}</Heading>
          <p className="mt-1.5 text-xs font-semibold tracking-wide text-gold-700 uppercase">{course.tagline}</p>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-mist-700">{course.description}</p>

          <div className="mt-6 flex items-center justify-between border-t border-mist-100 pt-5">
            <span className={cn("text-xs font-medium text-mist-600", !showModules && "invisible")}>
              {course.modules.length} {course.modules.length === 1 ? "module" : "modules"}
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-royal-700">
              View course
              <span className="flex size-8 items-center justify-center rounded-full bg-royal-50 transition-colors duration-300 group-hover:bg-gold-400 group-hover:text-royal-950">
                <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </span>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
