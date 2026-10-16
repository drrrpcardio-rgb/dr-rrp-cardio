import { ReactNode } from "react";
import { PageHero } from "./PageHero";

export interface LegalSection {
  heading: string;
  body: ReactNode;
}

interface LegalPageProps {
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

/** Shared layout for the Privacy Policy and Terms pages. */
export function LegalPage({ eyebrow, title, updated, intro, sections }: LegalPageProps) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} description={`Last updated: ${updated}`} />
      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
        <p className="text-base leading-relaxed text-mist-700">{intro}</p>
        <div className="mt-10 space-y-10">
          {sections.map((s, i) => (
            <div key={s.heading}>
              <h2 className="font-heading text-xl font-semibold text-ink">
                {i + 1}. {s.heading}
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-mist-700 [&_a]:font-medium [&_a]:text-royal-800 [&_a]:underline [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
                {s.body}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
