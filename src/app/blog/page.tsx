import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { BlogList } from "@/components/blog/BlogList";
import { formatDate, getAllPosts } from "@/lib/blog";
import { brand } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Blog",
  description: `Clinical cases, ECG and cath lab explainers and teaching notes from ${brand.name}.`,
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Cases and teaching notes"
        description="Clinical cases, ECG and cath lab explainers and practical teaching notes."
      />
      <section className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
        {posts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-mist-300 bg-mist-50 p-10 text-center text-sm text-mist-600">
            New posts are on the way.
          </p>
        ) : (
          <BlogList
            posts={posts.map((p) => ({
              slug: p.slug,
              title: p.title,
              description: p.description,
              dateLabel: formatDate(p.date),
              tags: p.tags,
              kicker: p.kicker,
              cover: p.cover,
              readingMinutes: p.readingMinutes,
            }))}
          />
        )}
      </section>
    </>
  );
}
