"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Schematic 3D coronary tree viewed through a virtual C-arm.
 * Angles: positive = LAO / cranial, negative = RAO / caudal. For teaching only.
 */

type V3 = [number, number, number];
const D = Math.PI / 180;
const RAD: V3 = [1.0, 1.15, 0.8]; // heart ellipsoid radii (x left, y cranial, z anterior)
const TILT = 35 * D; // apex points to the patient's left

const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(...a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

function tilt([x, y, z]: V3): V3 {
  return [x * Math.cos(TILT) - y * Math.sin(TILT), x * Math.sin(TILT) + y * Math.cos(TILT), z];
}

/** Point on the heart surface from azimuth (0 = anterior, + = patient left) and latitude, in degrees. */
function surface(th: number, ph: number, k = 1.03): V3 {
  const t = th * D;
  const p = ph * D;
  return tilt([RAD[0] * Math.cos(p) * Math.sin(t) * k, RAD[1] * Math.sin(p) * k, RAD[2] * Math.cos(p) * Math.cos(t) * k]);
}

function catmull(pts: V3[], n = 8): V3[] {
  const out: V3[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];
    for (let s = 0; s < n; s++) {
      const t = s / n;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([0, 1, 2].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)) as V3);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

interface SegDef {
  id: string;
  name: string;
  w: number;
  pts: [number, number][];
}

const SEGMENT_DEFS: SegDef[] = [
  { id: "lm", name: "Left main", w: 4.2, pts: [[12, 50], [24, 42], [35, 35]] },
  { id: "plad", name: "Proximal LAD", w: 3.6, pts: [[35, 35], [30, 25], [25, 12]] },
  { id: "mlad", name: "Mid LAD", w: 3.2, pts: [[25, 12], [21, -2], [18, -18], [14, -30]] },
  { id: "dlad", name: "Distal LAD", w: 2.4, pts: [[14, -30], [10, -45], [4, -60], [-2, -72]] },
  { id: "d1", name: "Diagonal 1", w: 2.4, pts: [[25, 12], [40, 0], [55, -12], [68, -30]] },
  { id: "d2", name: "Diagonal 2", w: 2.0, pts: [[18, -18], [32, -30], [46, -40], [58, -55]] },
  { id: "plcx", name: "Proximal LCx", w: 3.4, pts: [[35, 35], [50, 30], [68, 24]] },
  { id: "dlcx", name: "Mid/distal LCx", w: 2.6, pts: [[68, 24], [90, 17], [115, 11], [140, 5]] },
  { id: "om1", name: "Obtuse marginal 1", w: 2.4, pts: [[68, 24], [82, 5], [92, -20], [98, -48]] },
  { id: "om2", name: "Obtuse marginal 2", w: 2.0, pts: [[115, 11], [122, -15], [127, -40]] },
  { id: "prca", name: "Proximal RCA", w: 3.6, pts: [[-12, 50], [-30, 40], [-48, 28]] },
  { id: "mrca", name: "Mid RCA", w: 3.2, pts: [[-48, 28], [-62, 12], [-78, 2], [-95, -4]] },
  { id: "drca", name: "Distal RCA", w: 2.8, pts: [[-95, -4], [-115, -3], [-135, -1], [-150, 0]] },
  { id: "pda", name: "PDA", w: 2.2, pts: [[-150, 0], [-155, -20], [-160, -42], [-168, -62]] },
  { id: "plv", name: "Posterolateral branch", w: 2.0, pts: [[-150, 0], [-165, -6], [-180, -12], [-195, -22]] },
  { id: "rvm", name: "Acute marginal", w: 2.0, pts: [[-62, 12], [-50, -12], [-38, -35], [-28, -52]] },
];

interface Seg {
  id: string;
  name: string;
  w: number;
  line: V3[];
  tangents: V3[];
}

const SEGMENTS: Seg[] = SEGMENT_DEFS.map((d) => {
  const line = catmull(d.pts.map(([th, ph]) => surface(th, ph)));
  const tangents = line.slice(1).map((p, i) => norm(sub(p, line[i])));
  return { id: d.id, name: d.name, w: d.w, line, tangents };
});

const ROOT = surface(0, 58, 1);
const AORTA: V3[] = catmull([ROOT, [ROOT[0], ROOT[1] + 0.35, ROOT[2] + 0.05], [ROOT[0] - 0.05, ROOT[1] + 0.85, ROOT[2] - 0.05], [ROOT[0] - 0.4, ROOT[1] + 1.1, ROOT[2] - 0.3], [ROOT[0] - 0.75, ROOT[1] + 0.85, ROOT[2] - 0.45]]);

const GRID: V3[][] = (() => {
  const lines: V3[][] = [];
  for (let ph = -60; ph <= 60; ph += 30) lines.push(Array.from({ length: 49 }, (_, i) => surface(i * 7.5, ph, 1)));
  for (let th = 0; th < 360; th += 30) lines.push(Array.from({ length: 37 }, (_, i) => surface(th, -90 + i * 5, 1)));
  return lines;
})();

function camera(lao: number, cran: number) {
  const a = lao * D;
  const b = cran * D;
  const c: V3 = [Math.sin(a) * Math.cos(b), Math.sin(b), Math.cos(a) * Math.cos(b)];
  const r: V3 = [Math.cos(a), 0, -Math.sin(a)];
  const u: V3 = [c[1] * r[2] - c[2] * r[1], c[2] * r[0] - c[0] * r[2], c[0] * r[1] - c[1] * r[0]];
  return { c, r, u };
}

/** Percent of a segment's length lost to foreshortening when viewed along `c`. */
function foreshortening(seg: Seg, c: V3) {
  let sum = 0;
  for (const t of seg.tangents) sum += 1 - Math.sqrt(Math.max(0, 1 - dot(t, c) ** 2));
  return (sum / seg.tangents.length) * 100;
}

function bestView(seg: Seg) {
  let best = { lao: 0, cran: 0, fs: 101 };
  for (let lao = -90; lao <= 90; lao += 5)
    for (let cran = -45; cran <= 45; cran += 5) {
      const fs = foreshortening(seg, camera(lao, cran).c);
      if (fs < best.fs) best = { lao, cran, fs };
    }
  return best;
}

const fsColor = (fs: number) => (fs < 20 ? "#22c55e" : fs < 45 ? "#f59e0b" : "#ef4444");

function label(lao: number, cran: number) {
  const h = lao === 0 ? "AP" : lao > 0 ? `LAO ${lao}°` : `RAO ${-lao}°`;
  const v = cran === 0 ? "" : cran > 0 ? ` · Cranial ${cran}°` : ` · Caudal ${-cran}°`;
  return h + v;
}

const PRESETS: { name: string; lao: number; cran: number; note: string }[] = [
  { name: "AP", lao: 0, cran: 0, note: "Straight on" },
  { name: "RAO cranial", lao: -30, cran: 25, note: "Mid and distal LAD, diagonals" },
  { name: "LAO cranial", lao: 40, cran: 30, note: "Mid LAD, diagonal origins" },
  { name: "Spider", lao: 45, cran: -30, note: "Left main, proximal LAD and LCx" },
  { name: "RAO caudal", lao: -30, cran: -25, note: "Proximal LCx and obtuse marginals" },
  { name: "LAO", lao: 40, cran: 0, note: "Proximal and mid RCA" },
  { name: "RAO", lao: -30, cran: 0, note: "Mid RCA, PDA" },
  { name: "AP cranial", lao: 0, cran: 30, note: "Distal RCA and PDA" },
  { name: "Lateral", lao: 90, cran: 0, note: "Mid LAD and RCA" },
];

export function AngioView3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [lao, setLao] = useState(0);
  const [cran, setCran] = useState(0);
  const [angio, setAngio] = useState(false);
  const [colour, setColour] = useState(true);
  const [labels, setLabels] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [size, setSize] = useState(0);

  const cam = useMemo(() => camera(lao, cran), [lao, cran]);
  const fs = useMemo(() => Object.fromEntries(SEGMENTS.map((s) => [s.id, foreshortening(s, cam.c)])), [cam]);
  const sel = SEGMENTS.find((s) => s.id === selected) ?? null;
  const best = useMemo(() => (sel ? bestView(sel) : null), [sel]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const scale = Math.min(w, h) / 3.9;
    const ox = w / 2;
    const oy = h / 2 + scale * 0.25;
    const proj = (p: V3): [number, number] => [ox + dot(p, cam.r) * scale, oy - dot(p, cam.u) * scale];

    if (angio) {
      const g = ctx.createRadialGradient(ox, h / 2, 10, ox, h / 2, Math.max(w, h) * 0.7);
      g.addColorStop(0, "#d9dce0");
      g.addColorStop(1, "#8d9298");
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = "#0b1230";
    }
    ctx.fillRect(0, 0, w, h);

    const path = (pts: V3[]) => {
      ctx.beginPath();
      pts.forEach((p, i) => {
        const [x, y] = proj(p);
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      });
    };

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // heart wireframe
    ctx.strokeStyle = angio ? "rgba(40,44,52,0.18)" : "rgba(169,180,238,0.16)";
    ctx.lineWidth = 1;
    for (const l of GRID) {
      path(l);
      ctx.stroke();
    }

    // aorta
    ctx.strokeStyle = angio ? "rgba(20,22,26,0.35)" : "rgba(169,180,238,0.35)";
    ctx.lineWidth = scale * 0.2;
    path(AORTA);
    ctx.stroke();

    // vessels, farthest first
    const order = [...SEGMENTS].sort((a, b) => dot(a.line[Math.floor(a.line.length / 2)], cam.c) - dot(b.line[Math.floor(b.line.length / 2)], cam.c));
    for (const s of order) {
      const isSel = s.id === selected;
      const base = s.w * (scale / 120);
      if (isSel) {
        ctx.strokeStyle = angio ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)";
        ctx.lineWidth = base + 7;
        path(s.line);
        ctx.stroke();
      }
      ctx.strokeStyle = angio ? "#0c0d10" : colour ? fsColor(fs[s.id]) : "#f2c94c";
      ctx.lineWidth = base;
      path(s.line);
      ctx.stroke();
    }

    if (labels) {
      ctx.font = "600 11px system-ui, sans-serif";
      ctx.textAlign = "center";
      for (const s of SEGMENTS) {
        const p = s.line[Math.floor(s.line.length / 2)];
        const [x, y] = proj(p);
        ctx.fillStyle = angio ? "#111" : "#e7ebfb";
        ctx.fillText(s.name, x, y - 9);
      }
    }
  }, [cam, angio, colour, labels, selected, size, fs]);

  const move = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY };
    setLao((v) => Math.max(-90, Math.min(90, Math.round(v - dx * 0.4))));
    setCran((v) => Math.max(-45, Math.min(45, Math.round(v + dy * 0.3))));
  };

  const toggle = (on: boolean, set: (v: boolean) => void, text: string) => (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => set(!on)}
      className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition", on ? "border-gold-300 bg-gold-300 text-royal-950" : "border-royal-200 text-royal-800 hover:bg-royal-50")}
    >
      {text}
    </button>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div>
        <div ref={wrapRef} className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-royal-200 shadow-lg">
          <canvas
            ref={canvasRef}
            className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
            onPointerDown={(e) => {
              drag.current = { x: e.clientX, y: e.clientY };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={move}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
            role="img"
            aria-label={`Schematic coronary tree seen at ${label(lao, cran)}`}
          />
          <div className="pointer-events-none absolute top-3 left-3 rounded-lg bg-black/60 px-3 py-1.5 text-sm font-semibold text-white">{label(lao, cran)}</div>
          <div className="pointer-events-none absolute right-3 bottom-3 rounded bg-black/50 px-2 py-1 text-[11px] text-white/80">Drag to rotate the C-arm</div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-royal-900">
            RAO ← → LAO: {lao}°
            <input type="range" min={-90} max={90} value={lao} onChange={(e) => setLao(+e.target.value)} className="mt-1 w-full accent-[#d99a00]" />
          </label>
          <label className="block text-sm font-medium text-royal-900">
            Caudal ← → Cranial: {cran}°
            <input type="range" min={-45} max={45} value={cran} onChange={(e) => setCran(+e.target.value)} className="mt-1 w-full accent-[#d99a00]" />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {toggle(angio, setAngio, "Angiogram look")}
          {toggle(colour, setColour, "Colour by foreshortening")}
          {toggle(labels, setLabels, "Labels")}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              title={p.note}
              onClick={() => {
                setLao(p.lao);
                setCran(p.cran);
              }}
              className="rounded-lg border border-royal-200 px-3 py-1.5 text-xs font-semibold text-royal-800 hover:bg-royal-50"
            >
              {p.name}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-royal-700">
          {PRESETS.find((p) => p.lao === lao && p.cran === cran)?.note ?? "Hover a preset for what it is usually used to show."}
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold tracking-wide text-royal-900 uppercase">Foreshortening in this view</h3>
        <p className="mt-1 text-xs text-royal-700">Green is a clear view of the segment. Red means it is seen end-on and looks short. Tap a segment to select it.</p>
        <ul className="mt-3 space-y-1">
          {SEGMENTS.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setSelected(selected === s.id ? null : s.id)}
                className={cn("flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm", selected === s.id ? "bg-royal-100" : "hover:bg-royal-50")}
              >
                <span className="w-40 shrink-0 text-royal-900">{s.name}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-royal-100">
                  <span className="block h-full rounded-full" style={{ width: `${Math.min(100, fs[s.id])}%`, background: fsColor(fs[s.id]) }} />
                </span>
                <span className="w-10 text-right text-xs tabular-nums text-royal-700">{Math.round(fs[s.id])}%</span>
              </button>
            </li>
          ))}
        </ul>

        {sel && best && (
          <div className="mt-4 rounded-xl border border-gold-300 bg-gold-50 p-4 text-sm text-royal-950">
            <p className="font-semibold">Best view for {sel.name}</p>
            <p className="mt-1">
              {label(best.lao, best.cran)} gives about {Math.round(best.fs)}% foreshortening in this model (overlap with other vessels is not considered).
            </p>
            <button
              type="button"
              onClick={() => {
                setLao(best.lao);
                setCran(best.cran);
              }}
              className="mt-3 rounded-lg bg-royal-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-royal-800"
            >
              Move C-arm there
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
