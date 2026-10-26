"use client";

import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight, FileCheck, Users } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CertificatePreview } from "@/components/certificate/CertificatePreview";
import { Button } from "@/components/ui/Button";

export function CertificateSection() {
  return (
    <section className="bg-mist-50 py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionHeading
            eyebrow="Recognition"
            title="A certificate that reflects real learning"
          accent="real learning"
            description="Issued for genuine completion, not just attendance."
          />
          <ul className="mt-8 space-y-4 text-sm text-ink-soft">
            <li className="flex gap-3">
              <FileCheck size={20} className="mt-0.5 shrink-0 text-royal-700" aria-hidden="true" />
              <span>
                <strong className="text-ink">Completion:</strong> finish every module of a course and its assessment.
              </span>
            </li>
            <li className="flex gap-3">
              <Users size={20} className="mt-0.5 shrink-0 text-royal-700" aria-hidden="true" />
              <span>
                <strong className="text-ink">Participation:</strong> attend a live class or hands-on workshop.
              </span>
            </li>
            <li className="flex gap-3">
              <ShieldCheck size={20} className="mt-0.5 shrink-0 text-royal-700" aria-hidden="true" />
              <span>Every certificate carries a unique number that the academy can verify on request.</span>
            </li>
          </ul>
          <div className="mt-8">
            <Button href="/certificates" variant="secondary" icon={<ArrowRight size={16} />}>
              Learn about certificates
            </Button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20, rotate: -1 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="drop-shadow-2xl"
        >
          <CertificatePreview />
        </motion.div>
      </div>
    </section>
  );
}
