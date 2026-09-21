"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { getCourseCategory } from "@/lib/courses-data";
import { staggerItem } from "@/components/ui/Reveal";

export function CourseCard({ slug }: { slug: string }) {
  const course = getCourseCategory(slug);
  if (!course) return null;
  const Icon = course.icon;

  return (
    <motion.div variants={staggerItem}>
      <Link
        href={`/courses/${course.slug}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-mist-200 bg-white p-8 transition-shadow duration-300 hover:shadow-2xl hover:shadow-royal-900/10"
      >
        <motion.div
          whileHover={{ y: -6 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex h-full flex-col"
        >
          <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gold-400 transition-transform duration-500 group-hover:scale-x-100" />
          <motion.div
            whileHover={{ scale: 1.08, rotate: -4 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-royal-50 text-royal-700"
          >
            <Icon size={24} strokeWidth={1.75} />
          </motion.div>

          <h3 className="font-heading text-lg font-semibold text-ink">{course.name}</h3>
          <p className="mt-1 text-xs font-medium tracking-wide text-gold-700 uppercase">
            {course.tagline}
          </p>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-mist-700">
            {course.description}
          </p>

          <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-royal-700">
            <span className="relative">
              View Course
              <span className="absolute inset-x-0 -bottom-1 h-px origin-left scale-x-0 bg-gold-400 transition-transform duration-300 group-hover:scale-x-100" />
            </span>
            <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
