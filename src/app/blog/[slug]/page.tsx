import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpenText, Clock } from "lucide-react";
import { LazyVideos } from "@/components/blog/LazyVideos";
import { ReadingProgress, TableOfContents } from "@/components/blog/PostSidebar";
import { PostToolbar } from "@/components/blog/PostToolbar";
import { Button } from "@/components/ui/Button";
import { formatDate, getAllPosts, getPost, issueLabel, postAuthors } from "@/lib/blog";
import { brand, siteUrl } from "@/lib/site-data";

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

/** The "Dr. RRP" badge shown beside the main author; co-authors are listed without one. */
function RrpBadge({ className }: { className: string }) {
  return (
    <span aria-hidden="true" className={`flex shrink-0 flex-col items-center justify-center rounded-full font-heading leading-none font-semibold ${className}`}>
      <span className="text-[9px]">Dr.</span>
      <span className="text-xs tracking-wide">RRP</span>
    </span>
  );
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const url = `${siteUrl}/blog/${post.slug}/`;
  const authors = postAuthors(post);
  const section = post.kicker?.split("·")[0].trim() ?? "Article";
  const others = getAllPosts().filter((p) => p.slug !== post.slug).slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: authors.map((a) => ({ "@type": "Person", name: a.name, jobTitle: a.title })),
    publisher: { "@type": "Organization", name: brand.name },
    mainEntityOfPage: url,
  };

  return (
    <>
      {/* Masthead: issue label, section, title, authors and the case "cover". */}
      <header className="post-masthead relative overflow-hidden bg-royal-950 px-5 pt-32 pb-14 text-white sm:px-8 sm:pt-40 sm:pb-20">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,var(--color-royal-700)_0%,transparent_60%)] opacity-80" />
        <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold tracking-[0.2em] uppercase">
              <span className="text-white">{brand.name} · Case Files</span>
              <span className="rounded-full border border-gold-400/60 px-2.5 py-0.5 tracking-widest text-gold-300">{issueLabel(post.date)}</span>
            </div>
            <p className="mt-8 font-heading text-lg text-gold-300 italic">{section}</p>
            <h1 className="mt-2 font-heading text-4xl leading-[1.1] font-semibold text-white sm:text-5xl lg:text-[3.4rem]">{post.title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-royal-100">{post.description}</p>

            <ul className="mt-8 space-y-3">
              {authors.map((a, i) => (
                <li key={a.name} className={i === 0 ? "flex items-center gap-3" : "pl-[3.75rem]"}>
                  {i === 0 && <RrpBadge className="size-12 bg-gold-400 text-royal-950" />}
                  {i === 0 ? (
                    <span className="leading-snug">
                      <span className="block font-heading text-xl font-semibold text-white sm:text-2xl">{a.name}</span>
                      {a.title && <span className="block text-sm text-royal-200">{a.title}</span>}
                    </span>
                  ) : (
                    <span className="text-xs leading-snug">
                      <span className="font-semibold text-royal-100">{a.name}</span>
                      {a.title && <span className="text-royal-300"> · {a.title}</span>}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-royal-200">
              <span>{formatDate(post.date)}</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} aria-hidden="true" /> {post.readingMinutes} min read
              </span>
            </p>
          </div>

          {post.cover && (
            <figure className="mx-auto w-full max-w-sm lg:max-w-none">
              <div className="rotate-[1.5deg] rounded-2xl bg-white p-3 shadow-2xl shadow-black/40 ring-1 ring-white/20 transition-transform duration-500 hover:rotate-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.cover} alt="" className="aspect-[4/3] w-full rounded-xl bg-mist-50 object-contain" />
                <figcaption className="flex items-center justify-between px-1 pt-3 text-[11px] font-semibold tracking-widest text-royal-800 uppercase">
                  <span>{section}</span>
                  <span className="text-gold-600">{issueLabel(post.date)}</span>
                </figcaption>
              </div>
            </figure>
          )}
        </div>
      </header>

      <PostToolbar toc={post.toc} title={post.title} url={url} />
      <ReadingProgress />

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <Link href="/blog" className="no-print mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-royal-700 hover:underline">
          <ArrowLeft size={15} aria-hidden="true" /> All case files
        </Link>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-14">
          <article id="post-body" className="mx-auto w-full max-w-3xl lg:mx-0">
            {post.keyPoints.length > 0 && (
              <div className="mb-12 overflow-hidden rounded-2xl border border-royal-100">
                <p className="bg-royal-800 px-6 py-3 text-xs font-semibold tracking-widest text-white uppercase">At a glance</p>
                <ul className="space-y-3 bg-royal-50/60 p-6 text-[0.95rem] leading-relaxed text-ink-soft">
                  {post.keyPoints.map((k, i) => (
                    <li key={k} className="flex gap-3">
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-gold-400 text-xs font-bold text-royal-950">{i + 1}</span>
                      <span>{k}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Trusted HTML: rendered at build time from a Markdown file in the repository (see src/lib/blog.ts). */}
            <div id="post-content" className="blog-prose" data-size="md" dangerouslySetInnerHTML={{ __html: post.html }} />
            <LazyVideos rootId="post-content" />

            {/* Authors */}
            <section aria-labelledby="about-authors" className="mt-14 border-t border-mist-200 pt-10">
              <h2 id="about-authors" className="text-xs font-semibold tracking-widest text-mist-600 uppercase">
                About the {authors.length > 1 ? "authors" : "author"}
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {authors.map((a, i) => (
                  <div key={a.name} className="flex gap-4 rounded-2xl border border-mist-200 bg-white p-5">
                    {i === 0 && <RrpBadge className="size-12 bg-royal-800 text-gold-300" />}
                    <div className={i === 0 ? "text-sm leading-snug" : "text-xs leading-snug"}>
                      <p className={i === 0 ? "font-heading text-xl font-semibold text-ink" : "font-heading text-sm font-semibold text-ink"}>{a.name}</p>
                      {a.title && <p className="mt-1 text-royal-700">{a.title}</p>}
                      {a.bio && <p className="mt-1 text-mist-700">{a.bio}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {post.tags.length > 0 && (
              <div className="mt-10 flex flex-wrap gap-1.5">
                {post.tags.map((t) => (
                  <span key={t} className="rounded-full bg-royal-50 px-2.5 py-1 text-xs font-medium text-royal-700">
                    {t}
                  </span>
                ))}
              </div>
            )}

            {post.cta.length > 0 && (
              <div className="no-print mt-10 rounded-2xl bg-royal-950 p-8 text-center text-white">
                <p className="font-heading text-2xl font-semibold">{post.ctaTitle ?? "Learn the cath lab the structured way"}</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {post.cta.map((c, i) => (
                    <Button key={c.url} href={c.url.replace(siteUrl, "") || "/"} variant={i === 0 ? "gold" : "secondary"}>
                      {c.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sidebar: contents, the rest of the issue, resources */}
          <aside className="no-print mt-14 space-y-8 lg:sticky lg:top-28 lg:mt-0 lg:self-start">
            <div className="hidden lg:block">
              <TableOfContents items={post.toc} variant="panel" />
            </div>

            {others.length > 0 && (
              <div className="rounded-2xl border border-mist-200 bg-mist-50 p-5">
                <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-royal-800 uppercase">
                  <BookOpenText size={14} aria-hidden="true" /> In this issue
                </p>
                <ul className="mt-4 space-y-4">
                  {others.map((o) => (
                    <li key={o.slug}>
                      <Link href={`/blog/${o.slug}`} className="group flex gap-3">
                        {o.cover && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={o.cover} alt="" loading="lazy" className="h-14 w-20 shrink-0 rounded-lg border border-mist-200 bg-white object-contain" />
                        )}
                        <span className="text-sm leading-snug font-medium text-ink group-hover:text-royal-700">
                          <span className="block text-[10px] font-semibold tracking-widest text-gold-700 uppercase">{o.kicker?.split("·")[0].trim()}</span>
                          {o.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/blog" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-royal-700 hover:underline">
                  All case files <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </div>
            )}

            {post.cta.length > 0 && (
              <div className="rounded-2xl border border-gold-200 bg-gold-50 p-5">
                <p className="text-xs font-semibold tracking-widest text-gold-700 uppercase">Resources</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {post.cta.map((c) => (
                    <li key={c.url}>
                      <Link href={c.url.replace(siteUrl, "") || "/"} className="inline-flex items-center gap-1.5 font-medium text-royal-800 hover:underline">
                        <ArrowRight size={13} aria-hidden="true" /> {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
