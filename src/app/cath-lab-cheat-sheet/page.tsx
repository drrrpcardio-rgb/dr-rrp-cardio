import type { Metadata } from "next";
import { ArrowRight, Download } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { CheatSheetTabs } from "@/components/ui/CheatSheetTabs";
import { Button } from "@/components/ui/Button";
import { Bullets, Card, Muted, Table } from "@/components/ui/CheatSheet";
import { brand } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Cath Lab Views Cheat Sheet",
  description: `Coronary angiography projections at a glance from ${brand.name}: how to name a view, the best views for each vessel, TIMI flow, dominance and pitfalls. Free to read and download as a PDF.`,
};

const PDF_URL = "/downloads/RRP-Cardio-Cath-Lab-Views-Cheat-Sheet.pdf";

const jumpLinks = [
  { href: "#naming", label: "Name a view" },
  { href: "#left", label: "Left coronary" },
  { href: "#angles", label: "Starting angles" },
  { href: "#right", label: "Right coronary" },
  { href: "#reference", label: "TIMI & stenosis" },
  { href: "#pitfalls", label: "Pitfalls" },
];

const angles: [string, string][] = [
  ["AP cranial", "Cranial 30–40"],
  ["AP caudal", "Caudal 20–30"],
  ["RAO cranial", "RAO 30, cranial 20–30"],
  ["RAO caudal", "RAO 30, caudal 20–30"],
  ["LAO cranial", "LAO 30–50, cranial 20–30"],
  ["Spider (LAO caudal)", "LAO 40–60, caudal 20–40"],
  ["Lateral", "LAO 90"],
];

/** Detector position diagrams: patient seen from the feet (left) and from the side (right). */
function NamingDiagrams() {
  const arm = "#d99a00";
  const ink = "#1e3a8a";
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <figure>
        <svg viewBox="0 0 320 190" role="img" aria-label="Detector positions RAO, AP and LAO seen from the patient's feet" className="w-full">
          <path d="M60 150 C60 60 110 25 160 25 C210 25 260 60 260 150" fill="none" stroke="#9ca3af" strokeDasharray="4 5" />
          <rect x="145" y="14" width="30" height="12" rx="3" fill={arm} />
          <rect x="68" y="42" width="12" height="30" rx="3" fill={arm} transform="rotate(-40 74 57)" />
          <rect x="240" y="42" width="12" height="30" rx="3" fill={arm} transform="rotate(40 246 57)" />
          <ellipse cx="160" cy="125" rx="70" ry="28" fill="#e7ebfb" stroke={ink} strokeWidth="2" />
          <circle cx="160" cy="122" r="9" fill="#a9b4ee" />
          <text x="160" y="10" textAnchor="middle" fontSize="12" fontWeight="700" fill={ink}>AP</text>
          <text x="48" y="45" textAnchor="middle" fontSize="12" fontWeight="700" fill={ink}>RAO</text>
          <text x="272" y="45" textAnchor="middle" fontSize="12" fontWeight="700" fill={ink}>LAO</text>
          <line x1="40" y1="165" x2="280" y2="165" stroke="#6b7280" strokeWidth="2" />
          <text x="60" y="182" textAnchor="middle" fontSize="10" fill="#6b7280">Patient right</text>
          <text x="260" y="182" textAnchor="middle" fontSize="10" fill="#6b7280">Patient left</text>
        </svg>
        <figcaption className="text-center text-xs text-mist-600">Seen from the patient&apos;s feet</figcaption>
      </figure>
      <figure>
        <svg viewBox="0 0 320 190" role="img" aria-label="Detector positions cranial, AP and caudal seen from the side" className="w-full">
          <path d="M60 150 C60 60 110 25 160 25 C210 25 260 60 260 150" fill="none" stroke="#9ca3af" strokeDasharray="4 5" />
          <rect x="145" y="14" width="30" height="12" rx="3" fill={arm} />
          <rect x="68" y="42" width="12" height="30" rx="3" fill={arm} transform="rotate(-40 74 57)" />
          <rect x="240" y="42" width="12" height="30" rx="3" fill={arm} transform="rotate(40 246 57)" />
          <circle cx="62" cy="128" r="14" fill="#e7ebfb" stroke={ink} strokeWidth="2" />
          <rect x="76" y="116" width="190" height="24" rx="12" fill="#e7ebfb" stroke={ink} strokeWidth="2" />
          <circle cx="190" cy="128" r="6" fill="#a9b4ee" />
          <text x="160" y="10" textAnchor="middle" fontSize="12" fontWeight="700" fill={ink}>AP</text>
          <text x="48" y="45" textAnchor="middle" fontSize="12" fontWeight="700" fill={ink}>Cranial</text>
          <text x="272" y="45" textAnchor="middle" fontSize="12" fontWeight="700" fill={ink}>Caudal</text>
          <line x1="40" y1="165" x2="280" y2="165" stroke="#6b7280" strokeWidth="2" />
          <text x="62" y="182" textAnchor="middle" fontSize="10" fill="#6b7280">Head</text>
          <text x="258" y="182" textAnchor="middle" fontSize="10" fill="#6b7280">Feet</text>
        </svg>
        <figcaption className="text-center text-xs text-mist-600">Side view</figcaption>
      </figure>
    </div>
  );
}

export default function CathLabCheatSheetPage() {
  return (
    <>
      <PageHero
        eyebrow="Quick reference"
        title="Cath Lab Views Cheat Sheet"
        description="Coronary angiography projections at a glance: which view shows which vessel, and what to watch for."
      >
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href={PDF_URL}
            download
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-400 px-7 py-3.5 text-base font-medium text-ink shadow-sm transition hover:bg-gold-300 hover:shadow-md"
          >
            <Download size={18} aria-hidden="true" />
            Download PDF
          </a>
        </div>
      </PageHero>

      <CheatSheetTabs current="/cath-lab-cheat-sheet" />

      <section className="mx-auto max-w-6xl px-5 pt-10 sm:px-8">
        <nav aria-label="Jump to a section" className="flex flex-wrap justify-center gap-2">
          {jumpLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full border border-royal-100 bg-white px-4 py-1.5 text-sm font-medium text-royal-800 transition hover:border-royal-400 hover:bg-royal-50"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.2em] text-royal-600 uppercase">Page 1</p>
          <h2 className="mt-1 font-heading text-3xl font-semibold text-ink">Naming views and the left coronary</h2>
        </Reveal>

        <div className="mt-8 grid gap-6">
          <Card id="naming" title="How to name a view">
            <NamingDiagrams />
            <div className="mt-5 grid gap-x-8 gap-y-2 sm:grid-cols-2">
              <Bullets>
                <li><b>RAO / LAO:</b> the detector swings to the patient&apos;s right or left.</li>
                <li><b>Written as:</b> “LAO 40, caudal 30” (side first, then tilt).</li>
              </Bullets>
              <Bullets>
                <li><b>Cranial / caudal:</b> the detector tilts toward the head or the feet.</li>
                <li><b>Two views:</b> confirm every lesion in two views about 90° apart.</li>
              </Bullets>
            </div>
          </Card>

          <Card id="left" title="Left coronary: best views">
            <Table
              head={["Target", "Best views", "Why"]}
              rows={[
                ["Left main and bifurcation", "Spider (LAO caudal), AP caudal, RAO caudal", "Opens the LAD and LCx origins"],
                ["Proximal LAD", "LAO cranial, RAO caudal, spider", "Origin with less overlap"],
                ["Mid LAD and diagonals", "AP cranial, RAO cranial, LAO cranial", "Spreads diagonals away from the LAD"],
                ["Septals", "RAO cranial, LAO cranial", "Septal branches run down from the LAD"],
                ["Distal LAD and apex", "Lateral, RAO cranial", "Follows the LAD to the apex"],
                ["Proximal LCx and ramus", "Spider, RAO caudal, AP caudal", "Circumflex origin and ostium"],
                ["OMs and distal LCx", "RAO caudal, AP caudal, LAO caudal", "Marginals clear of the LAD"],
              ]}
            />
          </Card>

          <Card id="angles" title="Typical starting angles" note="adjust to the patient">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {angles.map(([name, a]) => (
                <div key={name} className="rounded-xl bg-royal-50 p-4">
                  <p className="font-semibold text-royal-800">{name}</p>
                  <p className="mt-1 text-sm">{a}</p>
                </div>
              ))}
              <div className="rounded-xl border border-gold-200 bg-gold-50 p-4">
                <p className="font-semibold text-gold-700">Heart position</p>
                <p className="mt-1 text-sm">Angles shift with habitus</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="bg-mist-50 px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-xs font-semibold tracking-[0.2em] text-royal-600 uppercase">Page 2</p>
            <h2 className="mt-1 font-heading text-3xl font-semibold text-ink">Right coronary and reference</h2>
          </Reveal>

          <div className="mt-8 grid items-start gap-6 md:grid-cols-2">
            <div className="grid gap-6">
              <Card id="right" title="Right coronary: best views">
                <Table
                  head={["Target", "Best views"]}
                  rows={[
                    ["Ostium and proximal RCA", "LAO 30–45, LAO cranial"],
                    ["Mid RCA", "LAO 30–45, RAO 30, lateral"],
                    ["Distal RCA and crux (PDA, PLV)", "LAO cranial, AP cranial"],
                  ]}
                />
                <p className="mt-4 rounded-lg bg-gold-50 px-4 py-2.5 text-sm">
                  <b>LAO is the workhorse for the RCA.</b> Add cranial tilt to split the PDA from the posterolateral
                  branches.
                </p>
              </Card>

              <Card title="Other common views">
                <Table
                  head={["Study", "View"]}
                  rows={[
                    ["LV gram", "RAO 30: anterolateral, apical and inferior walls. LAO 45–60: septum and lateral wall."],
                    ["Aortic root", "LAO 30–40"],
                  ]}
                />
              </Card>

              <Card title="Coronary dominance">
                <Table
                  head={["Pattern", "What it means"]}
                  rows={[
                    ["Right dominant (about 85%)", "RCA gives the PDA"],
                    ["Left dominant (about 8%)", "LCx gives the PDA"],
                    ["Co-dominant", "Both supply the inferior wall"],
                  ]}
                />
              </Card>
            </div>

            <div className="grid gap-6">
              <Card id="reference" title="TIMI flow grades">
                <Table
                  head={["Grade", "What you see"]}
                  rows={[
                    ["0", "No antegrade flow beyond the occlusion"],
                    ["1", "Contrast penetrates but does not fill the distal vessel"],
                    ["2", "Distal vessel fills, but slowly"],
                    ["3", "Normal, brisk filling"],
                  ]}
                />
              </Card>

              <Card title="Significant stenosis">
                <Table
                  head={["Measure", "Threshold"]}
                  rows={[
                    ["Epicardial vessel", "70% or more"],
                    ["Left main", "50% or more"],
                    ["FFR", "0.80 or lower"],
                    ["iFR", "0.89 or lower"],
                  ]}
                />
              </Card>

              <Card id="pitfalls" title="Pitfalls to avoid" className="border-gold-200 bg-gold-50">
                <Bullets>
                  <li><b>Foreshortening:</b> a segment looks short. Change the angle by 20–30°.</li>
                  <li><b>Overlap:</b> a branch hides the lesion. Pick a view that spreads them.</li>
                  <li><b>Ostial lesions:</b> catheter damping or deep intubation can mislead. Disengage and re-inject.</li>
                  <li><b>Spasm:</b> consider intracoronary nitrate before calling a lesion.</li>
                  <li><b>One view only:</b> always add a second view about 90° away.</li>
                  <li><b>Centre the lesion:</b> pan the table and collimate to cut dose.</li>
                </Bullets>
              </Card>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl bg-royal-800 px-6 py-4 text-center">
            <span className="font-heading text-lg font-semibold text-gold-300">Memory aid</span>
            <span className="text-sm font-semibold text-white sm:text-base">
              Cranial for the LAD. Caudal for the circumflex. Spider for the left main. LAO for the RCA.
            </span>
          </div>
          <Muted>
            Educational use only. Angles are typical starting points: adjust to the patient and operator preference.
          </Muted>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <Reveal>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-royal-100 bg-royal-50 p-8">
              <p className="font-heading text-xl font-semibold text-ink">Try these angles yourself</p>
              <p className="mt-2 text-sm leading-relaxed text-mist-700">
                Move the virtual C-arm and see how each projection changes what the angiogram shows.
              </p>
              <div className="mt-5">
                <Button href="/cath-lab" variant="secondary" icon={<ArrowRight size={16} />}>
                  Open the Cath Lab
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-royal-100 bg-royal-50 p-8">
              <p className="font-heading text-xl font-semibold text-ink">Want structured teaching?</p>
              <p className="mt-2 text-sm leading-relaxed text-mist-700">
                Our Cath Lab courses cover access, angiographic views, devices and procedures.
              </p>
              <div className="mt-5">
                <Button href="/courses/cath-lab" icon={<ArrowRight size={16} />}>
                  View Cath Lab courses
                </Button>
              </div>
            </div>
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-mist-700">
            Educational use only. Not patient-specific medical advice. © {new Date().getFullYear()} {brand.name}.
            Please do not copy or redistribute this sheet without written permission.
          </p>
        </Reveal>
      </section>
    </>
  );
}
