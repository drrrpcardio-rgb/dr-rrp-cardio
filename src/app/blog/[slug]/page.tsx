import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { Button } from "@/components/ui/Button";
import { formatDate, getAllPosts, getPost } from "@/lib/blog";
import { siteUrl } from "@/lib/site-data";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    openGraph: { type: "article", title: post.title, description: post.description, publishedTime: post.date },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: post.author ? { "@type": "Person", name: post.author } : undefined,
    mainEntityOfPage: `${siteUrl}/blog/${post.slug}/`,
  };

  return (
    <>
      <PageHero eyebrow={post.kicker} title={post.title} description={post.description}>
        <p className="mt-6 text-sm text-royal-200">
          {post.author && <span className="font-medium text-white">{post.author}</span>}
          {post.author && " · "}
          {formatDate(post.date)}
        </p>
      </PageHero>

      <article className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <Link href="/blog" className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-royal-700 hover:underline">
          <ArrowLeft size={15} aria-hidden="true" /> All posts
        </Link>

        {/* Trusted HTML: rendered at build time from a Markdown file in the repository (see src/lib/blog.ts). */}
        <div className="blog-prose" dangerouslySetInnerHTML={{ __html: post.html }} />

        {post.tags.length > 0 && (
          <div className="mt-12 flex flex-wrap gap-1.5 border-t border-mist-200 pt-6">
            {post.tags.map((t) => (
              <span key={t} className="rounded-full bg-royal-50 px-2.5 py-1 text-xs font-medium text-royal-700">
                {t}
              </span>
            ))}
          </div>
        )}

        {post.cta.length > 0 && (
          <div className="mt-10 rounded-2xl border border-royal-100 bg-royal-50 p-8 text-center">
            <p className="font-heading text-xl font-semibold text-ink">Learn the cath lab the structured way</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {post.cta.map((c, i) => (
                <Button key={c.url} href={c.url.replace(siteUrl, "") || "/"} variant={i === 0 ? "primary" : "secondary"}>
                  {c.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </article>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
