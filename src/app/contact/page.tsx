import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageSquareText, CalendarCheck, PlayCircle, ArrowRight } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { ContactForm } from "@/components/forms/ContactForm";
import { brand, contactEmail } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Contact",
  description: `Register your interest or send an enquiry to ${brand.name}.`,
};

const next = [
  { icon: MessageSquareText, text: "Tell us the course, live class or workshop you're interested in." },
  { icon: Mail, text: "We reply by email with dates, fees and how to join." },
  { icon: CalendarCheck, text: "Confirm your place and get ready for your first session." },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Register your interest"
        description="Tell us what you're looking for and we'll get back to you about the right course, live class, or workshop."
      />
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.3fr_0.7fr]">
        <Reveal>
          <ContactForm />
        </Reveal>

        <Reveal delay={0.1}>
          <aside className="space-y-6">
            <div className="rounded-3xl bg-royal-950 p-7 text-white">
              <h2 className="font-heading text-xl font-semibold">What happens next</h2>
              <ol className="mt-5 space-y-4">
                {next.map(({ icon: Icon, text }, i) => (
                  <li key={text} className="flex gap-3 text-sm text-royal-100">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-400 text-xs font-bold text-royal-950">{i + 1}</span>
                    <span className="flex items-start gap-2 pt-1.5">
                      <Icon size={16} className="mt-0.5 shrink-0 text-gold-300" aria-hidden="true" />
                      {text}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-3xl border border-mist-200 bg-white p-7">
              <h2 className="font-heading text-lg font-semibold text-ink">Prefer email?</h2>
              <a href={`mailto:${contactEmail}`} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-royal-700 hover:underline">
                <Mail size={16} aria-hidden="true" /> {contactEmail}
              </a>
            </div>

            <div className="rounded-3xl border border-mist-200 bg-mist-50 p-7">
              <h2 className="font-heading text-lg font-semibold text-ink">While you wait</h2>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/simulators" className="inline-flex items-center gap-2 font-medium text-royal-700 hover:underline">
                    <ArrowRight size={15} aria-hidden="true" /> Try the free simulators
                  </Link>
                </li>
                <li>
                  <Link href="/free-learning" className="inline-flex items-center gap-2 font-medium text-royal-700 hover:underline">
                    <PlayCircle size={15} aria-hidden="true" /> Watch free lessons
                  </Link>
                </li>
              </ul>
            </div>
          </aside>
        </Reveal>
      </section>
    </>
  );
}
