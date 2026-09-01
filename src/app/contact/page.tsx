import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { ContactForm } from "@/components/forms/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Register your interest or send an enquiry to Vector Cardiology Academy.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Register your interest"
        description="Tell us what you're looking for and we'll get back to you about the right course, live class, or workshop."
      />
      <section className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
        <Reveal>
          <ContactForm />
        </Reveal>
      </section>
    </>
  );
}
