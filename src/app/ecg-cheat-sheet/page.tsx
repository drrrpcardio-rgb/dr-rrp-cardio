import type { Metadata } from "next";
import { ArrowRight, Download } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { Bullets, Card, Muted, Table } from "@/components/ui/CheatSheet";
import { brand } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "ECG Cheat Sheet",
  description: `A two-page ECG cheat sheet from ${brand.name}: read any 12-lead ECG in 6 steps, then the patterns to recognise. Free to read and download as a PDF.`,
};

const PDF_URL = "/downloads/RRP-Cardio-ECG-Cheat-Sheet.pdf";

const jumpLinks = [
  { href: "#steps", label: "6 steps" },
  { href: "#stemi", label: "STEMI territory" },
  { href: "#av-blocks", label: "AV blocks" },
  { href: "#bbb", label: "Bundle branch blocks" },
  { href: "#tachycardia", label: "Tachycardia" },
  { href: "#electrolytes", label: "Electrolytes & drugs" },
  { href: "#dont-miss", label: "Don't miss these" },
];

export default function EcgCheatSheetPage() {
  return (
    <>
      <PageHero
        eyebrow="Quick reference"
        title="ECG Cheat Sheet"
        description="Read any 12-lead ECG in 6 steps, the same way every time. Then the patterns you must recognise."
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

      <section id="steps" className="mx-auto max-w-6xl scroll-mt-28 px-5 py-14 sm:px-8">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.2em] text-royal-600 uppercase">Page 1</p>
          <h2 className="mt-1 font-heading text-3xl font-semibold text-ink">Read any ECG in 6 steps</h2>
        </Reveal>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card n={1} title="Set up and check">
            <Bullets>
              <li>Standard: <b>25 mm/s</b> and <b>10 mm/mV</b>.</li>
              <li>1 small box = <b>0.04 s</b>. 1 large box = <b>0.2 s</b>.</li>
              <li>Right patient, right date, clean tracing, no tremor.</li>
              <li>Limb-lead reversal? Inverted P, QRS and T in lead I with an upright aVR.</li>
            </Bullets>
          </Card>

          <Card n={2} title="Rate">
            <Bullets>
              <li>Regular: <b>300 ÷ large boxes</b> between two R waves.</li>
              <li>Irregular: QRS count in a <b>6-second strip × 10</b>.</li>
              <li>Normal 60–100 bpm. Below 60 brady, above 100 tachy.</li>
            </Bullets>
            <div className="mt-4 overflow-x-auto rounded-lg bg-royal-50 px-3 py-2">
              <table className="w-full min-w-[300px] text-center text-sm">
                <tbody>
                  <tr className="text-mist-600">
                    <td className="py-0.5 text-left">Boxes (R–R)</td>
                    {[1, 2, 3, 4, 5, 6].map((b) => (
                      <td key={b}>{b}</td>
                    ))}
                  </tr>
                  <tr className="font-semibold text-royal-800">
                    <td className="py-0.5 text-left">bpm</td>
                    {[300, 150, 100, 75, 60, 50].map((b) => (
                      <td key={b}>{b}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <Card n={3} title="Rhythm">
            <Bullets>
              <li>A P wave before <b>every</b> QRS, and a QRS after every P?</li>
              <li>Regular or irregular? Check R–R and P–P.</li>
              <li><b>Sinus:</b> P upright in I, II, aVF and inverted in aVR, with a constant PR.</li>
              <li>QRS <b>narrow</b> (under 120 ms) or <b>wide</b>?</li>
              <li>No P waves: think AF, junctional or paced rhythm.</li>
            </Bullets>
          </Card>

          <Card n={4} title="Axis" note="normal −30° to +90°">
            <Table
              head={["Lead I", "aVF", "Axis"]}
              rows={[
                ["Positive", "Positive", <b key="n">Normal</b>],
                ["Positive", "Negative", "Left (LAD). Check lead II."],
                ["Negative", "Positive", "Right (RAD)"],
                ["Negative", "Negative", "Extreme (northwest)"],
              ]}
            />
            <Muted>LAD: LAFB, inferior MI. RAD: RVH, PE, lateral MI.</Muted>
          </Card>

          <Card n={5} title="Intervals">
            <Table
              head={["Interval", "Normal"]}
              rows={[
                [<b key="pr">PR</b>, "120–200 ms (3–5 small boxes)"],
                [<b key="qrs">QRS</b>, "Under 120 ms (under 3 small boxes)"],
                [<b key="qtc">QTc</b>, "Under 450 ms men, under 460 ms women. Over 500 ms is high risk."],
              ]}
            />
            <Muted>Bazett: QTc = QT ÷ √(R–R in seconds).</Muted>
          </Card>

          <Card n={6} title="P, QRS, ST, T">
            <Bullets>
              <li><b>P:</b> tall (over 2.5 mm) suggests right atrial enlargement. Wide or notched (120 ms or more) suggests left atrial.</li>
              <li><b>Q:</b> pathological if 40 ms or wider, or over 25% of the R wave.</li>
              <li><b>R progression:</b> R grows from V1 to V5. Transition at V3–V4.</li>
              <li><b>LVH:</b> S in V1 + R in V5 or V6 over 35 mm.</li>
              <li><b>ST:</b> measure at the J point against the TP or PR baseline.</li>
              <li><b>T:</b> normally inverted in aVR and V1. Tall and peaked: hyperK or hyperacute MI.</li>
            </Bullets>
          </Card>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-gold-200 bg-gold-50 px-6 py-4">
          <span className="font-heading text-lg font-semibold text-gold-700">Then ask</span>
          {["Is it normal?", "Is it dangerous?", "Compare with the old ECG"].map((q) => (
            <span key={q} className="rounded-xl bg-white px-5 py-2 text-sm font-medium text-ink shadow-sm">
              {q}
            </span>
          ))}
        </div>
      </section>

      <section className="bg-mist-50 px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-xs font-semibold tracking-[0.2em] text-royal-600 uppercase">Page 2</p>
            <h2 className="mt-1 font-heading text-3xl font-semibold text-ink">Patterns to recognise</h2>
          </Reveal>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card id="stemi" title="STEMI: which territory?" className="md:col-span-2">
              <Table
                head={["Territory", "Leads", "Artery"]}
                rows={[
                  ["Septal", "V1–V2", "LAD"],
                  ["Anterior", "V3–V4", "LAD"],
                  ["Lateral", "I, aVL, V5–V6", "LCx, diagonal"],
                  ["Inferior", "II, III, aVF", "RCA, LCx"],
                  ["Posterior", "ST↓ V1–V3, tall R. Add V7–V9.", "RCA, LCx"],
                  ["Right ventricle", "ST↑ in V4R", "Proximal RCA"],
                ]}
              />
              <Muted>
                Inferior: ST↑ III over II points to RCA. II equal to or above III points to LCx. In RV infarct,
                avoid preload-lowering drugs such as nitrates.
              </Muted>
              <Muted>
                STEMI criteria: new J-point ST↑ in 2 contiguous leads. 1 mm or more in all leads except V2–V3. In
                V2–V3: 2 mm men aged 40 and over, 2.5 mm men under 40, 1.5 mm women.
              </Muted>
            </Card>

            <Card id="av-blocks" title="AV blocks">
              <Table
                head={["Type", "What you see"]}
                rows={[
                  ["1st degree", "PR over 200 ms. Every P conducts."],
                  ["Mobitz I (Wenckebach)", "PR lengthens, then a beat drops. Grouped beating."],
                  ["Mobitz II", "Constant PR, sudden dropped QRS. Can progress: high risk."],
                  ["3rd degree", "P and QRS independent (AV dissociation). Slow, regular escape rhythm."],
                ]}
              />
            </Card>

            <Card id="bbb" title="Bundle branch blocks" note="QRS 120 ms or more">
              <Table
                head={["Block", "V1", "V6 (and I)"]}
                rows={[
                  ["LBBB", "Deep S or QS (the “W”)", "Broad, notched R (the “M”), no septal q"],
                  ["RBBB", "rSR′ (the “M”)", "Wide S (the “W”)"],
                ]}
              />
              <Muted>Chest pain with LBBB: compare with an old ECG and apply the Sgarbossa criteria.</Muted>
            </Card>

            <Card id="tachycardia" title="Tachycardia: width, then regularity" className="md:col-span-2">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Narrow, regular", "SVT (AVNRT, AVRT), flutter 2:1 at about 150, sinus tachycardia"],
                  ["Narrow, irregular", "AF, flutter with variable block, multifocal atrial tachycardia"],
                  ["Wide, regular", "VT until proven otherwise. SVT with a bundle branch block is less likely."],
                  ["Wide, irregular", "AF with BBB, pre-excited AF (WPW), polymorphic VT or torsades"],
                ].map(([h, t]) => (
                  <div key={h} className="rounded-xl bg-royal-50 p-4">
                    <p className="font-semibold text-royal-800">{h}</p>
                    <p className="mt-1.5 text-sm">{t}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-800">
                Unstable patient? Act first and interpret later.
              </p>
            </Card>

            <Card id="electrolytes" title="Electrolytes and drugs">
              <Table
                head={["Cause", "ECG"]}
                rows={[
                  ["High K⁺", "Peaked T, then flat P and long PR, wide QRS, sine wave"],
                  ["Low K⁺", "Flat T, ST↓, U waves"],
                  ["High Ca²⁺", "Short QT"],
                  ["Low Ca²⁺", "Long QT"],
                  ["Digoxin", "Scooped ST (“reverse tick”) and almost any arrhythmia"],
                ]}
              />
            </Card>

            <Card id="dont-miss" title="Don't miss these" className="border-gold-200 bg-gold-50">
              <Bullets>
                <li><b>Wellens:</b> biphasic or deep T inversion in V2–V3. Critical LAD lesion, often pain-free.</li>
                <li><b>de Winter:</b> upsloping ST↓ with tall T in V1–V6. LAD occlusion.</li>
                <li><b>Hyperacute T waves:</b> broad, tall T waves. Early MI.</li>
                <li><b>Pericarditis:</b> diffuse concave ST↑ with PR↓. Reciprocal in aVR.</li>
                <li><b>PE:</b> sinus tachycardia, S1Q3T3, T inversion in V1–V3.</li>
                <li><b>WPW:</b> short PR with a delta wave.</li>
                <li><b>Brugada:</b> coved ST↑ and T inversion in V1–V2.</li>
                <li><b>Long QT:</b> QTc over 500 ms. Torsades risk.</li>
              </Bullets>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <Reveal>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-royal-100 bg-royal-50 p-8">
              <p className="font-heading text-xl font-semibold text-ink">Practise what you read</p>
              <p className="mt-2 text-sm leading-relaxed text-mist-700">
                See each pattern on a live 12-lead ECG, with 97 presets, a library of 111 topics and a quiz.
              </p>
              <div className="mt-5">
                <Button href="/ecg-mastery" variant="secondary" icon={<ArrowRight size={16} />}>
                  Open ECG Mastery
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-royal-100 bg-royal-50 p-8">
              <p className="font-heading text-xl font-semibold text-ink">Want structured teaching?</p>
              <p className="mt-2 text-sm leading-relaxed text-mist-700">
                The {brand.coursePrefix} ECG courses take you from fundamentals to advanced interpretation.
              </p>
              <div className="mt-5">
                <Button href="/courses/ecg" icon={<ArrowRight size={16} />}>
                  View ECG courses
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
