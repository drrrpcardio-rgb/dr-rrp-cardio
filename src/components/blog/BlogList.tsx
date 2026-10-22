"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BlogCard {
  slug: string;
  title: string;
  description: string;
  dateLabel: string;
  tags: string[];
  kicker?: string;
  cover?: string;
  readingMinutes: number;
}

/** Blog index: tag filter chips above a grid of cards, each with a cover image, reading time and tags. */
export function BlogList({ posts }: { posts: BlogCard[] }) {
  const [active, setActive] = useState<string>("All");
  const tags = ["All", ...Array.from(new Set(posts.flatMap((p) => p.tags)))];
  const shown = active === "All" ? posts : posts.filter((p) => p.tags.includes(active));

  return (
    <div>
      {tags.length > 2 && (
        <div role="group" aria-label="Filter posts by tag" className="mb-10 flex flex-wrap gap-2">
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={active === t}
              onClick={() => setActive(t)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                active === t
                  ? "border-royal-700 bg-royal-700 text-white"
                  : "border-mist-200 bg-white text-mist-700 hover:border-royal-300 hover:text-royal-700",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {shown.map((p, i) => (
          <Link
            key={p.slug}
            href={`/blog/${p.slug}`}
            className={cn(
              "group flex flex-col overflow-hidden rounded-2xl border border-mist-200 bg-white shadow-sm transition hover:border-royal-300 hover:shadow-lg",
              i === 0 && active === "All" && "md:col-span-2 md:flex-row",
            )}
          >
            {p.cover && (
              <div
                className={cn(
                  "flex items-center justify-center bg-mist-50",
                  i === 0 && active === "All" ? "md:w-2/5" : "",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.cover} alt="" loading="lazy" className="h-48 w-full object-contain p-3 md:h-full md:max-h-72" />
              </div>
            )}
            <div className="flex flex-1 flex-col p-7">
              {p.kicker && <p className="text-xs font-semibold tracking-widest text-royal-600 uppercase">{p.kicker}</p>}
              <h2 className="mt-3 font-heading text-xl leading-snug font-semibold text-ink">{p.title}</h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-mist-700">{p.description}</p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {p.tags.slice(0, 4).map((t) => (
                  <span key={t} className="rounded-full bg-royal-50 px-2.5 py-1 text-xs font-medium text-royal-700">
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-3 text-mist-600">
                  {p.dateLabel}
                  <span className="inline-flex items-center gap-1">
                    <Clock size={13} aria-hidden="true" /> {p.readingMinutes} min read
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-royal-700">
                  Read <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {shown.length === 0 && (
        <p className="rounded-2xl border border-dashed border-mist-300 bg-mist-50 p-10 text-center text-sm text-mist-600">
          No posts with this tag yet.
        </p>
      )}
    </div>
  );
}
