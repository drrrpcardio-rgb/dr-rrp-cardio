import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { StaggerGroup } from "@/components/ui/Reveal";
import { brand } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Cheat Sheets",
  description: `Free two-page cheat sheets from ${brand.name}: ECG interpretation and Cath Lab angiography views. Read online or download the PDF.`,
};

const sheets = [
  {
    title: "ECG Cheat Sheet",
    text: "Read any 12-lead ECG in 6 steps, then the patterns you must recognise: STEMI territory, AV blocks, bundle branch blocks, tachycardia, electrolytes and the ones not to miss.",
    points: ["Rate, rhythm, axis, intervals", "STEMI territory and artery", "Don't-miss patterns"],
    href: "/ecg-cheat-sheet",
    pdf: "/downloads/RRP-Cardio-ECG-Cheat-Sheet.pdf",
    accent: "from-emerald-600 to-teal-800",
  },
  {
    title: "Cath Lab Views Cheat Sheet",
    text: "Coronary angiography projections at a glance: how to name a view, the best views for each vessel, TIMI flow, dominance and the pitfalls to avoid.",
    points: ["Best views for LAD, LCx and RCA", "Typical starting angles", "TIMI flow and stenosis thresholds"],
    href: "/cath-lab-cheat-sheet",
    pdf: "/downloads/RRP-Cardio-Cath-Lab-Views-Cheat-Sheet.pdf",
    accent: "from-amber-500 to-orange-700",
  },
];

export default function CheatSheetsPage() {
  return (
    <>
      <PageHero
        eyebrow="Quick reference"
        title="Cheat Sheets"
        description="Free two-page references you can read online or download as a PDF."
      />
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <StaggerGroup className="grid gap-6 md:grid-cols-2">
          {sheets.map((s) => (
            <div key={s.title} className="flex flex-col overflow-hidden rounded-2xl border border-mist-200 bg-white shadow-sm">
              <div className={`bg-gradient-to-br ${s.accent} p-7 text-white`}>
                <p className="text-xs font-semibold tracking-widest text-white/75 uppercase">2 pages · PDF</p>
                <h2 className="mt-3 font-heading text-2xl font-semibold">{s.title}</h2>
              </div>
              <div className="flex flex-1 flex-col p-7">
                <p className="text-sm leading-relaxed text-mist-700">{s.text}</p>
                <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-ink-soft marker:text-royal-400">
                  {s.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <Link
                    href={s.href}
                    className="inline-flex items-center gap-2 rounded-full bg-royal-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-royal-800"
                  >
                    Read online <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  <a
                    href={s.pdf}
                    download
                    className="inline-flex items-center gap-2 text-sm font-semibold text-royal-700 hover:underline"
                  >
                    <Download size={16} aria-hidden="true" /> Download PDF
                  </a>
                </div>
              </div>
            </div>
          ))}
        </StaggerGroup>
        <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-mist-700">
          Educational use only. Not patient-specific medical advice. © {new Date().getFullYear()} {brand.name}. Please do not
          copy or redistribute these sheets without written permission.
        </p>
      </section>
    </>
  );
}
