"use client";

import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CertificatePreview } from "@/components/certificate/CertificatePreview";
import { Button } from "@/components/ui/Button";

export function CertificateSection() {
  return (
    <section className="bg-mist-50 py-24">
      <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
        <SectionHeading
          eyebrow="Recognition"
          align="center"
          title="A certificate that reflects real learning"
          description="Every completed course and workshop earns a certificate — issued for genuine completion, not just attendance."
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-12"
        >
          <CertificatePreview />
        </motion.div>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft">
            <ShieldCheck size={18} className="text-royal-700" />
            Verified &amp; recognised by the academy
          </p>
          <Button href="/certificates" variant="secondary" icon={<ArrowRight size={16} />}>
            Learn about certificates
          </Button>
        </div>
      </div>
    </section>
  );
}
