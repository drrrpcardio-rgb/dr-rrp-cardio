import type { Metadata } from "next";
import { FileCheck, Users } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { CertificatePreview } from "@/components/certificate/CertificatePreview";
import { VerifyForm } from "@/components/certificate/VerifyForm";

export const metadata: Metadata = {
  title: "Certificates",
  description:
    "Certificates of completion and participation issued by Vector Cardiology Academy.",
};

export default function CertificatesPage() {
  return (
    <>
      <PageHero
        eyebrow="Certificates"
        title="Recognition that means something"
        description="Vector issues two kinds of certificates. Knowing the difference helps you know what to expect from each."
      />

      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-2xl border border-mist-200 bg-white p-7">
              <FileCheck size={24} className="text-royal-700" strokeWidth={1.75} />
              <h3 className="font-heading mt-4 text-lg font-semibold text-ink">
                Certificate of Completion
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-mist-700">
                Issued when a learner finishes all modules of a course and
                meets its assessment requirements. This certifies genuine
                completion of the structured curriculum, not just enrolment.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="h-full rounded-2xl border border-mist-200 bg-white p-7">
              <Users size={24} className="text-royal-700" strokeWidth={1.75} />
              <h3 className="font-heading mt-4 text-lg font-semibold text-ink">
                Certificate of Participation
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-mist-700">
                Issued for attending a live class or workshop session. It
                recognises attendance and engagement, distinct from the
                completion certificate awarded for a full course.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-mist-50 py-20">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <Reveal>
            <h2 className="font-heading mb-8 text-center text-2xl font-semibold text-ink">
              What it looks like
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <CertificatePreview />
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-5 py-20 sm:px-8">
        <Reveal>
          <VerifyForm />
        </Reveal>
      </section>
    </>
  );
}
