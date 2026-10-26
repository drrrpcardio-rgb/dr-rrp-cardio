"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ClipboardCopy, FilePlus2, FlaskConical, Printer, RotateCcw, Search, Trash2, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { CALCS, CATEGORIES, LEVEL_NAMES, calcById, isSelect, type Calc, type Result } from "@/lib/echo-calculators";

type Values = Record<string, string>;
interface Patient {
  h: string;
  w: string;
  sex: string;
}
interface ReportEntry {
  id: string;
  title: string;
  lines: string[];
}

const LEVEL_STYLE = [
  "bg-emerald-50 text-emerald-800 ring-emerald-200",
  "bg-amber-50 text-amber-800 ring-amber-200",
  "bg-orange-50 text-orange-800 ring-orange-200",
  "bg-red-50 text-red-800 ring-red-200",
];
const LEVEL_BAR = ["bg-emerald-500", "bg-amber-400", "bg-orange-500", "bg-red-600"];

const PATIENT_KEY = "rrp-echo-calc-patient";
const REPORT_KEY = "rrp-echo-calc-report";
const EMPTY_PATIENT: Patient = { h: "", w: "", sex: "m" };

// Patient details and the report live in this browser only
function load<T>(k: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}

function num(x: string | undefined) {
  const t = (x ?? "").trim();
  const v = Number(t.replace(",", "."));
  return t !== "" && Number.isFinite(v) && v > 0 ? v : undefined;
}

/** Mosteller BSA from the shared patient details */
function patientBsa(p: Patient) {
  const h = num(p.h), w = num(p.w);
  return h && w ? Math.sqrt((h * w) / 3600) : undefined;
}

// Sex is left unset so it follows the patient details until changed in a calculator
function defaults(c: Calc): Values {
  const v: Values = {};
  for (const f of c.fields) if (isSelect(f) && f.key !== "sex") v[f.key] = f.options[0].value;
  return v;
}

/** BSA and sex come from the patient details unless the calculator has its own value */
function run(c: Calc, v: Values, p: Patient): Result[] {
  const n: Partial<Record<string, number>> = {}, s: Record<string, string> = {};
  for (const f of c.fields) {
    const raw = (v[f.key] ?? "").trim();
    if (isSelect(f)) s[f.key] = raw || (f.key === "sex" ? p.sex : "") || f.options[0].value;
    else {
      const x = num(raw) ?? (f.key === "bsa" ? patientBsa(p) : f.key === "ht" ? num(p.h) : undefined);
      if (x !== undefined) n[f.key] = x;
    }
  }
  try {
    return c.compute(n, s).filter((r) => r.text !== undefined || (r.value !== undefined && Number.isFinite(r.value)));
  } catch {
    return [];
  }
}

const fmt = (r: Result) => (r.value === undefined ? r.text ?? "" : r.value.toFixed(r.digits ?? 1));
function resultLine(r: Result) {
  const val = r.value !== undefined ? `${fmt(r)}${r.unit ? " " + r.unit : ""}` : fmt(r);
  const grade = r.level !== undefined ? r.tag ?? LEVEL_NAMES[r.level] : "";
  return `${r.label}: ${val}${grade && grade !== val ? ` (${grade.toLowerCase()})` : ""}`;
}
const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const esc = (t: string) => t.replace(/[&<>"]/g, (ch) => ESC[ch]);

export function EchoCalculators() {
  const [id, setId] = useState(CALCS.find((c) => c.id === "rv-size")!.id);
  const [cat, setCat] = useState<string>("Right ventricle");
  const [query, setQuery] = useState("");
  const [all, setAll] = useState<Record<string, Values>>({});
  const [patient, setPatient] = useState<Patient>(EMPTY_PATIENT);
  const [report, setReport] = useState<ReportEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const loaded = useRef(false);
  const chipsRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage after hydration
    setPatient(load(PATIENT_KEY, EMPTY_PATIENT));
    setReport(load(REPORT_KEY, [] as ReportEntry[]));
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (loaded.current) save(PATIENT_KEY, patient);
  }, [patient]);
  useEffect(() => {
    if (loaded.current) save(REPORT_KEY, report);
  }, [report]);

  // On phones the chip row scrolls sideways: keep the active category in view
  useEffect(() => {
    const row = chipsRef.current, chip = row?.querySelector<HTMLElement>("[data-active]");
    if (row && chip && row.scrollWidth > row.clientWidth) row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: "smooth" });
  }, [cat]);

  // Deep links: /echo-calculators#lv-mass opens that calculator
  useEffect(() => {
    const open = () => {
      const c = calcById(location.hash.slice(1));
      if (c) {
        setId(c.id);
        setCat(c.cat);
      }
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);

  const calc = calcById(id)!;
  const values = all[id] ?? defaults(calc);
  const results = useMemo(() => run(calc, values, patient), [calc, values, patient]);
  const bsa = patientBsa(patient);
  const inReport = report.some((e) => e.id === calc.id);

  const choose = (c: Calc) => {
    setId(c.id);
    setCat(c.cat);
    history.replaceState(null, "", `#${c.id}`);
    // Stacked layout (phones, tablets): the calculator sits below the list, so bring it into view
    if (window.matchMedia("(max-width: 1023px)").matches) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const setValue = (k: string, v: string) => setAll((a) => ({ ...a, [id]: { ...(a[id] ?? defaults(calc)), [k]: v } }));
  const example = () => setAll((a) => ({ ...a, [id]: { ...defaults(calc), ...Object.fromEntries(Object.entries(calc.example).map(([k, v]) => [k, String(v)])) } }));
  const clear = () => setAll((a) => ({ ...a, [id]: defaults(calc) }));

  const addToReport = () => {
    const entry: ReportEntry = { id: calc.id, title: calc.title, lines: results.map(resultLine) };
    setReport((r) => (r.some((e) => e.id === calc.id) ? r.map((e) => (e.id === calc.id ? entry : e)) : [...r, entry]));
  };
  const patientLine = bsa ? `Patient: ${patient.h} cm, ${patient.w} kg, BSA ${bsa.toFixed(2)} m², ${patient.sex === "f" ? "female" : "male"}` : "";
  const reportText = () => [patientLine, ...report.flatMap((e) => [e.title, ...e.lines.map((l) => `  ${l}`)])].filter(Boolean).join("\n");
  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };
  const printReport = () => {
    const w = window.open("", "_blank", "width=720,height=900");
    if (!w) return;
    const body = report.map((e) => `<h2>${esc(e.title)}</h2><ul>${e.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`).join("");
    w.document.write(
      `<!doctype html><meta charset="utf-8"><title>Echo measurements</title><style>body{font:14px/1.5 system-ui,sans-serif;margin:32px;color:#0e1320}h1{font-size:20px;margin:0 0 4px}h2{font-size:15px;margin:18px 0 4px;color:#1e3a8a}ul{margin:0;padding-left:18px}p{color:#565d72;margin:0}</style><h1>Echo measurements</h1><p>${esc(patientLine)}</p>${body}<p style="margin-top:24px;font-size:12px">Dr. RRP Cardio echo calculators. For education; check against the full guidelines.</p>`,
    );
    w.document.close();
    w.focus();
    w.print();
  };

  const q = query.trim().toLowerCase();
  const list = q ? CALCS.filter((c) => `${c.title} ${c.blurb} ${c.cat}`.toLowerCase().includes(q)) : CALCS.filter((c) => c.cat === cat);
  const pInput = "w-full min-w-0 rounded-xl bg-transparent px-3 py-2 text-sm tabular-nums text-ink outline-none";
  const btn = "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-500";

  return (
    <div className="space-y-6">
      {/* Shared patient details: fill BSA and sex in every calculator */}
      <div className="flex flex-wrap items-end gap-3 rounded-3xl border border-royal-100 bg-white p-4 shadow-sm sm:p-5">
        <p className="flex basis-full items-center gap-2 text-xs font-semibold uppercase tracking-widest text-royal-700 sm:basis-auto sm:self-center">
          <UserRound className="size-4 text-gold-500" aria-hidden="true" /> Patient
        </p>
        <label className="w-28">
          <span className="mb-1 block text-xs font-medium text-royal-900">Height</span>
          <span className="flex items-center rounded-xl border border-mist-200 focus-within:border-royal-400">
            <input inputMode="decimal" value={patient.h} onChange={(e) => setPatient((p) => ({ ...p, h: e.target.value }))} placeholder="—" className={pInput} />
            <span className="pr-3 text-xs text-mist-600">cm</span>
          </span>
        </label>
        <label className="w-28">
          <span className="mb-1 block text-xs font-medium text-royal-900">Weight</span>
          <span className="flex items-center rounded-xl border border-mist-200 focus-within:border-royal-400">
            <input inputMode="decimal" value={patient.w} onChange={(e) => setPatient((p) => ({ ...p, w: e.target.value }))} placeholder="—" className={pInput} />
            <span className="pr-3 text-xs text-mist-600">kg</span>
          </span>
        </label>
        <label className="w-32">
          <span className="mb-1 block text-xs font-medium text-royal-900">Sex</span>
          <select
            value={patient.sex}
            onChange={(e) => setPatient((p) => ({ ...p, sex: e.target.value }))}
            className="w-full rounded-xl border border-mist-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-royal-400"
          >
            <option value="m">Male</option>
            <option value="f">Female</option>
          </select>
        </label>
        <p className="pb-2 text-sm text-ink-soft">
          BSA <span className="font-semibold tabular-nums text-royal-950">{bsa ? bsa.toFixed(2) : "—"}</span> m²
          <span className="ml-2 hidden text-xs text-mist-600 md:inline">fills BSA and sex in every calculator</span>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Picker */}
        <aside className="min-w-0 rounded-3xl border border-royal-100 bg-white p-4 shadow-sm lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
          <label className="relative block">
            <span className="sr-only">Search calculators</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mist-500" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search calculators…"
              className="w-full rounded-xl border border-mist-200 bg-mist-50 py-2.5 pl-9 pr-3 text-sm text-ink outline-none focus:border-royal-400 focus:bg-white"
            />
          </label>
          {!q && (
            <div ref={chipsRef} className="relative -mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:overflow-visible">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  data-active={c === cat ? "" : undefined}
                  aria-pressed={c === cat}
                  onClick={() => setCat(c)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-royal-500",
                    c === cat ? "border-royal-700 bg-royal-700 text-white" : "border-mist-200 bg-white text-royal-800 hover:border-royal-300",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          <ul className="mt-4 space-y-1">
            {list.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => choose(c)}
                  aria-current={c.id === id ? "true" : undefined}
                  className={cn(
                    "w-full rounded-xl px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-royal-500",
                    c.id === id ? "bg-royal-50 ring-1 ring-royal-200" : "hover:bg-mist-50",
                  )}
                >
                  <span className="block text-sm font-semibold text-royal-950">{c.title}</span>
                  <span className="block text-xs text-mist-700">
                    {q ? `${c.cat} · ` : ""}
                    {c.blurb}
                  </span>
                </button>
              </li>
            ))}
            {!list.length && <li className="px-3 py-4 text-sm text-mist-700">No calculator matches “{query}”.</li>}
          </ul>
        </aside>

        {/* Calculator */}
        <section ref={panelRef} className="min-w-0 scroll-mt-24 space-y-5" aria-live="polite">
          <div className="rounded-3xl border border-royal-100 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">{calc.cat}</p>
            <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-heading text-2xl font-semibold text-royal-950">{calc.title}</h2>
              <div className="flex gap-2">
                <button type="button" onClick={example} className={cn(btn, "border-royal-200 text-royal-800 hover:bg-royal-50")}>
                  <FlaskConical className="size-3.5" aria-hidden="true" /> Worked example
                </button>
                <button type="button" onClick={clear} className={cn(btn, "border-mist-200 text-mist-700 hover:bg-mist-50")}>
                  <RotateCcw className="size-3.5" aria-hidden="true" /> Clear
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {calc.fields.map((f) =>
                isSelect(f) ? (
                  <label key={f.key} className="sm:col-span-2">
                    <span className="mb-1 block text-xs font-medium text-royal-900">{f.label}</span>
                    <select
                      value={values[f.key] ?? (f.key === "sex" ? patient.sex : f.options[0].value)}
                      onChange={(e) => setValue(f.key, e.target.value)}
                      className="w-full rounded-xl border border-mist-200 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-royal-400"
                    >
                      {f.options.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <label key={f.key}>
                    <span className="mb-1 flex items-baseline justify-between gap-2 text-xs font-medium text-royal-900">
                      {f.label}
                      {(f.optional || f.hint) && <span className="font-normal text-mist-500">{f.hint ?? "optional"}</span>}
                    </span>
                    <span className="flex items-center rounded-xl border border-mist-200 bg-white focus-within:border-royal-400">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={values[f.key] ?? ""}
                        onChange={(e) => setValue(f.key, e.target.value)}
                        placeholder={f.key === "bsa" && bsa ? `${bsa.toFixed(2)} from patient` : f.key === "ht" && num(patient.h) ? `${patient.h} from patient` : "—"}
                        className="w-full min-w-0 rounded-xl bg-transparent px-3 py-2.5 text-sm tabular-nums text-ink outline-none"
                      />
                      <span className="shrink-0 pr-3 text-xs text-mist-600">{f.unit}</span>
                    </span>
                  </label>
                ),
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-royal-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-royal-700">Results</h3>
              {results.length > 0 && (
                <button type="button" onClick={addToReport} className={cn(btn, "border-gold-400 bg-gold-400 font-semibold text-royal-950 hover:bg-gold-300")}>
                  <FilePlus2 className="size-3.5" aria-hidden="true" /> {inReport ? "Update in report" : "Add to report"}
                </button>
              )}
            </div>
            {results.length ? (
              <ul className="mt-3 divide-y divide-mist-100">
                {results.map((r) => (
                  <li key={r.label} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
                    <span className="flex items-center gap-2 text-sm text-ink-soft">
                      {r.level !== undefined && <span className={cn("size-2 rounded-full", LEVEL_BAR[r.level])} aria-hidden="true" />}
                      {r.label}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className={cn("tabular-nums text-royal-950", r.value !== undefined ? "text-lg font-semibold" : "text-sm font-medium")}>
                        {fmt(r)}
                        {r.unit && <span className="ml-1 text-xs font-normal text-mist-600">{r.unit}</span>}
                      </span>
                      {r.level !== undefined && (r.value !== undefined || (r.tag && r.tag !== r.text)) && (
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium ring-1", LEVEL_STYLE[r.level])}>{r.tag ?? LEVEL_NAMES[r.level]}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-mist-700">Enter measurements above, or load the worked example. Results update as you type.</p>
            )}
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-3xl border border-royal-100 bg-royal-950 p-5 text-royal-50 sm:p-6">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gold-300">Formula</h3>
              <ul className="mt-3 space-y-2 font-mono text-sm leading-relaxed">
                {calc.formula.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {calc.note && <p className="mt-4 border-t border-royal-800 pt-3 text-xs leading-relaxed text-royal-200">{calc.note}</p>}
            </div>

            {calc.reference && (
              <div className="min-w-0 rounded-3xl border border-royal-100 bg-white p-5 shadow-sm sm:p-6">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-royal-700">Reference ranges</h3>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-mist-200 text-xs text-mist-700">
                        {calc.reference.cols.map((c, i) => (
                          <th key={i} className="whitespace-nowrap py-2 pr-3 font-medium">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="tabular-nums">
                      {calc.reference.rows.map((row, i) => (
                        <tr key={i} className="border-b border-mist-100 last:border-0">
                          {row.map((cell, j) => (
                            <td key={j} className={cn("py-2 pr-3", j === 0 ? "min-w-28 text-ink-soft" : "whitespace-nowrap text-royal-950")}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {calc.reference.caption && <p className="mt-2 text-xs text-mist-700">{calc.reference.caption}</p>}
              </div>
            )}
          </div>

          <p className="flex flex-wrap justify-between gap-2 text-xs text-mist-700">
            <span>Source: {calc.source}</span>
            <Link href="/echo-simulator" className="font-medium text-royal-700 underline-offset-2 hover:underline">
              Practise these measurements in the echo simulator →
            </Link>
          </p>

          {report.length > 0 && (
            <div className="rounded-3xl border-2 border-gold-300 bg-gold-50 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-royal-800">
                  Report · {report.length} {report.length === 1 ? "calculator" : "calculators"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={copyReport} className={cn(btn, "border-royal-200 bg-white text-royal-800 hover:bg-royal-50")}>
                    <ClipboardCopy className="size-3.5" aria-hidden="true" /> {copied ? "Copied" : "Copy"}
                  </button>
                  <button type="button" onClick={printReport} className={cn(btn, "border-royal-200 bg-white text-royal-800 hover:bg-royal-50")}>
                    <Printer className="size-3.5" aria-hidden="true" /> Print
                  </button>
                  <button type="button" onClick={() => setReport([])} className={cn(btn, "border-mist-200 bg-white text-mist-700 hover:bg-mist-50")}>
                    <Trash2 className="size-3.5" aria-hidden="true" /> Clear
                  </button>
                </div>
              </div>
              {patientLine && <p className="mt-2 text-xs text-ink-soft">{patientLine}</p>}
              <div className="mt-3 space-y-3">
                {report.map((e) => (
                  <div key={e.id}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-royal-950">{e.title}</p>
                      <button
                        type="button"
                        onClick={() => setReport((r) => r.filter((x) => x.id !== e.id))}
                        className="text-xs text-mist-600 hover:text-red-700"
                        aria-label={`Remove ${e.title} from the report`}
                      >
                        Remove
                      </button>
                    </div>
                    <ul className="mt-1 space-y-0.5 text-sm text-ink-soft">
                      {e.lines.map((l) => (
                        <li key={l}>{l}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
