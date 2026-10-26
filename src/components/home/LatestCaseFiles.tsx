import Link from "next/link";
import { ArrowRight, ArrowUpRight, Clock } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { formatDate, getAllPosts } from "@/lib/blog";

/** The newest case files from the blog, magazine style: one large lead story and the rest beside it. */
export function LatestCaseFiles() {
  const posts = getAllPosts().slice(0, 3);
  if (posts.length === 0) return null;
  const [lead, ...rest] = posts;
  const section = (k?: string) => k?.split("·")[0].trim() ?? "Article";

  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <SectionHeading
          eyebrow="Case files"
          title="Fresh from the cath lab"
          accent="cath lab"
          description="Real cases, written up as teaching stories: what the ECG, the echo and the angiogram showed, and what we learned."
        />
        <Link href="/blog" className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-royal-700">
          <span className="underline-grow">All case files</span>
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>

      <div className={`mt-12 grid gap-6 ${rest.length ? "lg:grid-cols-[1.35fr_1fr]" : ""}`}>
        <Reveal>
          <Link
            href={`/blog/${lead.slug}`}
            className="spotlight group flex h-full flex-col overflow-hidden rounded-3xl border border-mist-200 bg-white transition-shadow duration-300 hover:shadow-2xl hover:shadow-royal-900/10"
          >
            {lead.cover && (
              <div className="overflow-hidden bg-royal-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lead.cover}
                  alt=""
                  loading="lazy"
                  className="aspect-[16/9] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
              </div>
            )}
            <div className="flex flex-1 flex-col p-7 sm:p-8">
              <p className="text-xs font-semibold tracking-[0.18em] text-gold-700 uppercase">{section(lead.kicker)}</p>
              <h3 className="mt-3 font-heading text-2xl leading-snug font-semibold text-ink group-hover:text-royal-700 sm:text-3xl">{lead.title}</h3>
              <p className="mt-3 flex-1 leading-relaxed text-mist-700">{lead.description}</p>
              <p className="mt-6 flex items-center gap-4 text-sm text-mist-600">
                <span>{formatDate(lead.date)}</span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={14} aria-hidden="true" /> {lead.readingMinutes} min read
                </span>
              </p>
            </div>
          </Link>
        </Reveal>

        {rest.length > 0 && (
          <div className="grid gap-6">
            {rest.map((p, i) => (
              <Reveal key={p.slug} delay={0.1 * (i + 1)}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="spotlight group flex h-full gap-5 overflow-hidden rounded-3xl border border-mist-200 bg-white p-5 transition-shadow duration-300 hover:shadow-xl hover:shadow-royal-900/10"
                >
                  {p.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.cover} alt="" loading="lazy" className="hidden aspect-[4/3] w-36 shrink-0 self-start rounded-2xl border border-mist-200 bg-mist-50 object-contain sm:block" />
                  )}
                  <div className="flex flex-col">
                    <p className="text-xs font-semibold tracking-[0.18em] text-gold-700 uppercase">{section(p.kicker)}</p>
                    <h3 className="mt-2 font-heading text-lg leading-snug font-semibold text-ink group-hover:text-royal-700">{p.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-mist-700">{p.description}</p>
                    <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-royal-700">
                      Read <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
