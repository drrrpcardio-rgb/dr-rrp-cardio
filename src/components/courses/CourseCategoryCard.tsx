"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { getCourseCategory } from "@/lib/courses-data";
import { staggerItem } from "@/components/ui/Reveal";

export function CourseCategoryCard({ slug }: { slug: string }) {
  const course = getCourseCategory(slug);
  if (!course) return null;
  const Icon = course.icon;

  return (
    <motion.div variants={staggerItem}>
      <Link
        href={`/courses/${course.slug}`}
        className="group flex h-full flex-col rounded-2xl border border-mist-200 bg-white p-8 transition-shadow hover:shadow-xl hover:shadow-royal-900/5"
      >
        <motion.div
          whileHover={{ scale: 1.08, rotate: -4 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-royal-50 text-royal-700"
        >
          <Icon size={28} strokeWidth={1.75} />
        </motion.div>
        <h2 className="font-heading text-xl font-semibold text-ink">{course.name}</h2>
        <p className="mt-1 text-xs font-medium tracking-wide text-gold-700 uppercase">
          {course.tagline}
        </p>
        <p className="mt-4 flex-1 text-sm leading-relaxed text-mist-700">{course.description}</p>
        <p className="mt-5 text-xs font-medium text-mist-600">
          {course.modules.length} {course.modules.length === 1 ? "module" : "modules"}
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-royal-700">
          Explore
          <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </Link>
    </motion.div>
  );
}
