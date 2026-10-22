import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { StaggerGroup } from "@/components/ui/Reveal";
import { formatDate, getAllPosts } from "@/lib/blog";
import { brand } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Blog",
  description: `Case reports, ECG and cath lab explainers and teaching notes from ${brand.name}.`,
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Cases and teaching notes"
        description="Case reports, ECG and cath lab explainers and practical teaching notes."
      />
      <section className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
        {posts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-mist-300 bg-mist-50 p-10 text-center text-sm text-mist-600">
            New posts are on the way.
          </p>
        ) : (
          <StaggerGroup className="grid gap-6 md:grid-cols-2">
            {posts.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="group flex flex-col rounded-2xl border border-mist-200 bg-white p-7 shadow-sm transition hover:border-royal-300 hover:shadow-lg"
              >
                {p.kicker && (
                  <p className="text-xs font-semibold tracking-widest text-royal-600 uppercase">{p.kicker}</p>
                )}
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
                  <span className="text-mist-600">{formatDate(p.date)}</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-royal-700">
                    Read case <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </StaggerGroup>
        )}
      </section>
    </>
  );
}
