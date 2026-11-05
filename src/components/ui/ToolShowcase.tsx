import Image from "next/image";
import { ArrowRight, Check, ExternalLink, GraduationCap } from "lucide-react";
import { Reveal } from "./Reveal";
import { Button } from "./Button";
import { cathLabVisual } from "@/lib/tools-data";
import { cn } from "@/lib/utils";

/**
 * Wide card for CathLab Visual, the patient guide. A plain <a>, not <Link>, because the guide is a
 * static app in /public rather than an app route.
 */
export function CathLabVisualCard({ className, headingAs: Heading = "h3" }: { className?: string; headingAs?: "h2" | "h3" }) {
  const g = cathLabVisual;
  return (
    <a
      href={g.href}
      className={cn(
        "group grid overflow-hidden rounded-3xl border border-royal-100 bg-white shadow-sm transition-shadow hover:shadow-xl md:grid-cols-[1.15fr_1fr]",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-royal-950 md:aspect-auto md:min-h-72">
        <Image
          src={g.image}
          alt={`${g.title} screenshot`}
          fill
          sizes="(max-width: 768px) 100vw, 640px"
          className="object-cover object-left-top transition-transform duration-700 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-col p-7 sm:p-9">
        <p className="text-xs font-semibold tracking-widest text-gold-700 uppercase">{g.tag}</p>
        <Heading className="mt-2 font-heading text-2xl font-semibold text-royal-950 sm:text-3xl">{g.title}</Heading>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{g.text}</p>
        <ul className="mt-4 flex-1 space-y-1.5 text-sm text-ink-soft">
          {g.points.map((p) => (
            <li key={p} className="flex items-center gap-2">
              <Check size={15} className="shrink-0 text-gold-500" aria-hidden="true" /> {p}
            </li>
          ))}
        </ul>
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-royal-700">
          Open {g.title}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </div>
    </a>
  );
}

interface ToolFrameProps {
  src: string;
  title: string;
  /** Text shown in the faux address bar. */
  address: string;
  fullHref: string;
  /** Short feature highlights shown under the preview. */
  highlights: string[];
}

/** Dark "device" band: a browser-style frame around the embedded simulator plus feature chips. */
export function ToolFrame({ src, title, address, fullHref, highlights }: ToolFrameProps) {
  return (
    <section className="relative overflow-hidden bg-royal-950 px-5 py-20 sm:px-8">
      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative mx-auto max-w-6xl">
        <Reveal>
          <p className="text-center text-xs font-semibold tracking-[0.2em] text-gold-300 uppercase">
            Try it now
          </p>
          <h2 className="mt-3 text-center font-heading text-3xl font-semibold text-white sm:text-4xl">
            Live in your browser, free
          </h2>

          <div className="mt-10 overflow-hidden rounded-2xl border border-white/15 bg-ink shadow-2xl shadow-black/40">
            <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-4 py-3">
              <span aria-hidden="true" className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-400/80" />
                <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
              </span>
              <span className="mx-auto truncate rounded-md bg-black/30 px-4 py-1 text-xs text-white/60">
                {address}
              </span>
              <a
                href={fullHref}
                aria-label={`Open ${title} full screen`}
                className="text-white/60 transition-colors hover:text-white"
              >
                <ExternalLink size={16} />
              </a>
            </div>
            <iframe
              src={src}
              title={title}
              loading="lazy"
              className="h-[75vh] min-h-[520px] w-full bg-royal-950"
            />
          </div>

          <ul className="mt-8 flex flex-wrap justify-center gap-3">
            {highlights.map((h) => (
              <li
                key={h}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-royal-100"
              >
                {h}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-center text-sm text-royal-200">
            Prefer more room?{" "}
            <a className="font-medium text-gold-300 underline" href={fullHref}>
              Open it full screen
            </a>
            .
          </p>
        </Reveal>
      </div>
    </section>
  );
}

interface CourseLinkProps {
  title: string;
  text: string;
  href: string;
  cta: string;
}

/** Cross-link from a simulator page to the matching course. */
export function CourseCrossLink({ title, text, href, cta }: CourseLinkProps) {
  return (
    <Reveal delay={0.1}>
      <div className="flex flex-col items-start gap-6 rounded-2xl border border-royal-100 bg-royal-50 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
        <div className="flex gap-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-royal-700 text-white">
            <GraduationCap size={24} aria-hidden="true" />
          </span>
          <div>
            <p className="font-heading text-xl font-semibold text-ink">{title}</p>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-mist-700">{text}</p>
          </div>
        </div>
        <Button href={href} icon={<ArrowRight size={16} />}>
          {cta}
        </Button>
      </div>
    </Reveal>
  );
}
