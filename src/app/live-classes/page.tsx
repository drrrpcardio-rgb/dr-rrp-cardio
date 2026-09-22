import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { SessionAgenda } from "@/components/sessions/SessionAgenda";
import { LiveClassesList } from "@/components/sessions/LiveClassesList";
import { featuredSession, isUpcoming } from "@/lib/sessions-data";
import { brand } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Live Classes",
  description: `Online and offline live classes from ${brand.name}.`,
};

export default function LiveClassesPage() {
  const upcoming = isUpcoming(featuredSession);

  return (
    <>
      <PageHero
        eyebrow="Live Classes"
        title="Online & offline programmes"
        description="Structured live teaching, in person and online, with hands-on time built into every session."
      />

      <section className="mx-auto max-w-4xl px-5 py-16 sm:px-8">
        <Reveal>
          <div className="rounded-2xl border border-mist-200 bg-white p-8 shadow-sm">
            <span
              className={
                upcoming
                  ? "inline-flex w-fit items-center rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold tracking-wide text-gold-700 uppercase"
                  : "inline-flex w-fit items-center rounded-full bg-mist-100 px-3 py-1 text-xs font-semibold tracking-wide text-mist-700 uppercase"
              }
            >
              {upcoming ? "Upcoming" : "Recently Held"}
            </span>
            <p className="mt-4 text-xs font-semibold tracking-wide text-royal-700 uppercase">
              {featuredSession.courseName}
            </p>
            <h2 className="font-heading mt-1 text-2xl font-semibold text-ink">
              {featuredSession.title}
            </h2>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-mist-700">
              <span>{featuredSession.displayDate}</span>
              <span>{featuredSession.time}</span>
              {featuredSession.venue &&
                (featuredSession.venueMapUrl ? (
                  <a
                    href={featuredSession.venueMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-dotted underline-offset-2 hover:text-royal-700"
                  >
                    {featuredSession.venue}
                  </a>
                ) : (
                  <span>{featuredSession.venue}</span>
                ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {featuredSession.audience.map((a) => (
                <span
                  key={a}
                  className="rounded-full bg-royal-50 px-2.5 py-1 text-xs font-medium text-royal-700"
                >
                  {a}
                </span>
              ))}
            </div>
            <p className="mt-5 text-sm leading-relaxed text-mist-700">
              {featuredSession.objective}
            </p>

            <h3 className="font-heading mt-10 mb-6 text-lg font-semibold text-ink">
              Session Agenda
            </h3>
            <SessionAgenda agenda={featuredSession.agenda} />
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <h2 className="font-heading mb-8 text-2xl font-semibold text-ink">All Programmes</h2>
        <LiveClassesList />
      </section>
    </>
  );
}
