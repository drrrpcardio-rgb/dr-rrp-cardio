import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { StaggerGroup, Reveal } from "@/components/ui/Reveal";
import { SessionCard } from "@/components/sessions/SessionCard";
import { WorkshopPlaceholderCard } from "@/components/sessions/WorkshopPlaceholderCard";
import { Button } from "@/components/ui/Button";
import { allSessions } from "@/lib/sessions-data";
import { brand } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Workshops",
  description: `Hands-on cardiology workshops from ${brand.name}.`,
};

export default function WorkshopsPage() {
  return (
    <>
      <PageHero
        eyebrow="Workshops"
        title="Hands-on, case-driven workshops"
        description="Every workshop pairs a short lecture with extended hands-on time — because interpretation is a skill you build by doing it."
      />

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {allSessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
          <WorkshopPlaceholderCard />
        </StaggerGroup>

        <Reveal delay={0.1}>
          <div className="mt-16 flex flex-col items-center gap-4 rounded-2xl border border-royal-100 bg-royal-50 p-10 text-center">
            <p className="font-heading text-xl font-semibold text-ink">
              Want to be notified about the next workshop?
            </p>
            <p className="max-w-md text-sm text-mist-700">
              Register your interest and we&rsquo;ll reach out as soon as
              seats open for the next hands-on session.
            </p>
            <Button href="/contact" icon={<ArrowRight size={16} />}>
              Enquire Now
            </Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
