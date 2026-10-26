/**
 * Echo calculators: inputs, formulas and grading against guideline cut-offs.
 * Each calculator is pure data plus a compute() function, so the UI can render any of them.
 *
 * Main sources: ASE/EACVI chamber quantification 2015, ASE/EACVI diastolic function 2016,
 * ASE native valvular regurgitation 2017, ACC/AHA valvular heart disease 2020,
 * ASE right heart 2010, ESC/ERS pulmonary hypertension 2022.
 */

export type Level = 0 | 1 | 2 | 3;
export const LEVEL_NAMES = ["Normal", "Mild", "Moderate", "Severe"] as const;

export interface NumField {
  key: string;
  label: string;
  unit: string;
  hint?: string;
  optional?: boolean;
}
export interface SelectField {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}
export type Field = NumField | SelectField;
export const isSelect = (f: Field): f is SelectField => "options" in f;

export interface Result {
  label: string;
  value?: number;
  text?: string;
  unit?: string;
  digits?: number;
  /** 0 normal … 3 severe; omit for a plain number */
  level?: Level;
  /** overrides the level name shown on the badge */
  tag?: string;
}

export interface Calc {
  id: string;
  cat: string;
  title: string;
  blurb: string;
  fields: Field[];
  compute: (n: Partial<Record<string, number>>, s: Record<string, string>) => Result[];
  formula: string[];
  note?: string;
  reference?: { cols: string[]; rows: string[][]; caption?: string };
  source: string;
  example: Record<string, number | string>;
}

export const CATEGORIES = [
  "General",
  "Atria",
  "Right ventricle",
  "Left ventricle",
  "Aortic valve",
  "Mitral valve",
  "Tricuspid valve",
  "Pulmonary valve",
  "Diastology",
  "Pericardium",
  "Shunts",
  "Strain",
  "Aorta",
  "Prosthetic valves",
  "Haemodynamics",
] as const;

/** Severity from three cut-offs. "up": higher is worse (x < c0 normal). "down": lower is worse (x > c0 normal). */
function tier(x: number, cuts: [number, number, number], dir: "up" | "down" = "up"): Level {
  if (dir === "up") return x < cuts[0] ? 0 : x < cuts[1] ? 1 : x < cuts[2] ? 2 : 3;
  return x > cuts[0] ? 0 : x > cuts[1] ? 1 : x > cuts[2] ? 2 : 3;
}
const has = (...v: (number | undefined)[]) => v.every((x) => x !== undefined && Number.isFinite(x));
const area = (d: number) => Math.PI * (d / 2) ** 2; // circle area from diameter (cm → cm²)
const out = (r: (Result | false | undefined)[]) => r.filter(Boolean) as Result[];

const BSA: NumField = { key: "bsa", label: "BSA", unit: "m²", hint: "for indexed values", optional: true };
const SEX: SelectField = {
  key: "sex",
  label: "Sex",
  options: [
    { value: "m", label: "Male" },
    { value: "f", label: "Female" },
  ],
};

export const CALCS: Calc[] = [
  // ---------------- General ----------------
  {
    id: "bsa",
    cat: "General",
    title: "Body surface area",
    blurb: "BSA and BMI for indexing",
    fields: [
      { key: "h", label: "Height", unit: "cm" },
      { key: "w", label: "Weight", unit: "kg" },
    ],
    compute: ({ h, w }) => {
      if (!has(h, w)) return [];
      const most = Math.sqrt((h! * w!) / 3600), du = 0.007184 * h! ** 0.725 * w! ** 0.425, bmi = w! / (h! / 100) ** 2;
      return [
        { label: "BSA (Mosteller)", value: most, unit: "m²", digits: 2 },
        { label: "BSA (DuBois)", value: du, unit: "m²", digits: 2 },
        { label: "BMI", value: bmi, unit: "kg/m²", digits: 1, level: bmi < 25 ? 0 : bmi < 30 ? 1 : bmi < 35 ? 2 : 3, tag: bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese" },
      ];
    },
    formula: ["Mosteller: BSA = √(height × weight ÷ 3600)", "DuBois: BSA = 0.007184 × height^0.725 × weight^0.425", "BMI = weight ÷ height² (m)"],
    source: "Mosteller 1987; DuBois 1916",
    example: { h: 170, w: 72 },
  },
  {
    id: "bernoulli",
    cat: "General",
    title: "Bernoulli gradient",
    blurb: "Pressure drop from a velocity",
    fields: [
      { key: "v2", label: "Peak jet velocity", unit: "m/s" },
      { key: "v1", label: "Proximal velocity", unit: "m/s", hint: "include if > 1.5 m/s", optional: true },
    ],
    compute: ({ v1, v2 }) =>
      has(v2)
        ? out([
            { label: "Simplified gradient (4V²)", value: 4 * v2! ** 2, unit: "mmHg", digits: 0 },
            has(v1) && { label: "Modified gradient 4(V₂² − V₁²)", value: 4 * (v2! ** 2 - v1! ** 2), unit: "mmHg", digits: 0 },
          ])
        : [],
    formula: ["ΔP = 4 × V²", "ΔP = 4 × (V₂² − V₁²) when the proximal velocity is high"],
    note: "Velocities in m/s. Angle the beam parallel to the jet: underestimation grows quickly beyond 20°.",
    source: "Simplified Bernoulli equation",
    example: { v2: 4.2, v1: 1.1 },
  },

  // ---------------- Atria ----------------
  {
    id: "la-volume",
    cat: "Atria",
    title: "LA volume",
    blurb: "Biplane area-length and LAVi",
    fields: [
      { key: "a4", label: "LA area · A4C", unit: "cm²" },
      { key: "a2", label: "LA area · A2C", unit: "cm²" },
      { key: "l", label: "LA length · shorter", unit: "cm" },
      { key: "vol", label: "or LA volume", unit: "mL", hint: "if measured directly", optional: true },
      BSA,
    ],
    compute: ({ a4, a2, l, vol, bsa }) => {
      const v = has(vol) ? vol! : has(a4, a2, l) ? (0.85 * a4! * a2!) / l! : undefined;
      if (v === undefined) return [];
      const r: Result[] = [{ label: "LA volume", value: v, unit: "mL", digits: 0 }];
      if (has(bsa)) {
        const i = v / bsa!;
        r.push({ label: "LAVi", value: i, unit: "mL/m²", digits: 0, level: i <= 34 ? 0 : i <= 41 ? 1 : i <= 48 ? 2 : 3 });
      }
      return r;
    },
    formula: ["LAV = 0.85 × A4C area × A2C area ÷ L", "LAVi = LAV ÷ BSA"],
    note: "Measure at end-systole (frame before mitral opening), excluding the appendage and pulmonary veins. L is the shorter of the two lengths.",
    reference: { cols: ["LAVi (mL/m²)", "Grade"], rows: [["≤ 34", "Normal"], ["35–41", "Mild"], ["42–48", "Moderate"], ["> 48", "Severe"]] },
    source: "ASE/EACVI chamber quantification 2015",
    example: { a4: 20, a2: 19, l: 5.0, bsa: 1.9 },
  },
  {
    id: "ra-size",
    cat: "Atria",
    title: "RA size",
    blurb: "RA area and volume index",
    fields: [{ key: "area", label: "RA area · A4C", unit: "cm²", optional: true }, { key: "vol", label: "RA volume", unit: "mL", optional: true }, BSA, SEX],
    compute: ({ area: ar, vol, bsa }, { sex }) => {
      const uln = sex === "f" ? 33 : 39;
      return out([
        has(ar) && { label: "RA area", value: ar!, unit: "cm²", digits: 1, level: ar! > 18 ? 1 : 0, tag: ar! > 18 ? "Enlarged" : "Normal" },
        has(vol, bsa) && { label: "RAVi", value: vol! / bsa!, unit: "mL/m²", digits: 0, level: vol! / bsa! > uln ? 1 : 0, tag: vol! / bsa! > uln ? "Enlarged" : "Normal" },
      ]);
    },
    formula: ["RAVi = RA volume ÷ BSA (single-plane A4C disk summation)"],
    reference: { cols: ["Measure", "Upper limit"], rows: [["RA area (end-systole)", "18 cm²"], ["RAVi, men", "39 mL/m²"], ["RAVi, women", "33 mL/m²"]] },
    source: "ASE right heart 2010; ASE/EACVI 2015",
    example: { area: 21, vol: 62, bsa: 1.8, sex: "m" },
  },

  // ---------------- Right ventricle ----------------
  {
    id: "rv-size",
    cat: "Right ventricle",
    title: "RV size",
    blurb: "RV-focused A4C and RVOT dimensions",
    fields: [
      { key: "d1", label: "RVD1 · basal", unit: "cm", optional: true },
      { key: "d2", label: "RVD2 · mid", unit: "cm", optional: true },
      { key: "d3", label: "RVD3 · length", unit: "cm", optional: true },
      { key: "rvot1", label: "RVOT proximal · PLAX", unit: "cm", optional: true },
      { key: "rvot2", label: "RVOT distal · PSAX", unit: "cm", optional: true },
      { key: "wall", label: "RV free wall", unit: "cm", hint: "subcostal, diastole", optional: true },
    ],
    compute: ({ d1, d2, d3, rvot1, rvot2, wall }) => {
      const flag = (label: string, x: number | undefined, uln: number) =>
        has(x) && ({ label, value: x!, unit: "cm", digits: 1, level: x! > uln ? 1 : 0, tag: x! > uln ? "Dilated" : "Normal" } as Result);
      return out([
        flag("RVD1 · basal", d1, 4.1),
        flag("RVD2 · mid", d2, 3.5),
        flag("RVD3 · length", d3, 8.3),
        flag("RVOT proximal", rvot1, 3.3),
        flag("RVOT distal", rvot2, 2.7),
        has(wall) && { label: "RV wall", value: wall!, unit: "cm", digits: 1, level: wall! > 0.5 ? 1 : 0, tag: wall! > 0.5 ? "Hypertrophied" : "Normal" },
      ]);
    },
    formula: ["Compare each dimension with its upper reference limit"],
    note: "Measure in an RV-focused apical view at end-diastole, without foreshortening the RV.",
    reference: {
      cols: ["Measure", "Upper limit"],
      rows: [["RVD1 · basal", "4.1 cm"], ["RVD2 · mid", "3.5 cm"], ["RVD3 · length", "8.3 cm"], ["RVOT proximal (PLAX)", "3.3 cm"], ["RVOT distal (PSAX)", "2.7 cm"], ["RV free wall", "0.5 cm"]],
    },
    source: "ASE/EACVI chamber quantification 2015",
    example: { d1: 4.6, d2: 3.9, d3: 8.1, rvot1: 3.5, rvot2: 2.6, wall: 0.4 },
  },
  {
    id: "rv-function",
    cat: "Right ventricle",
    title: "RV function",
    blurb: "TAPSE, S′, FAC and RIMP",
    fields: [
      { key: "tapse", label: "TAPSE", unit: "mm", optional: true },
      { key: "s", label: "Tricuspid S′", unit: "cm/s", optional: true },
      { key: "eda", label: "RV end-diastolic area", unit: "cm²", optional: true },
      { key: "esa", label: "RV end-systolic area", unit: "cm²", optional: true },
      { key: "tco", label: "TV closure-to-opening", unit: "ms", hint: "for RIMP (TDI)", optional: true },
      { key: "et", label: "RV ejection time", unit: "ms", optional: true },
    ],
    compute: ({ tapse, s, eda, esa, tco, et }) => {
      const lo = (label: string, x: number, lln: number, unit: string, digits = 0) =>
        ({ label, value: x, unit, digits, level: x < lln ? 1 : 0, tag: x < lln ? "Reduced" : "Normal" }) as Result;
      return out([
        has(tapse) && lo("TAPSE", tapse!, 17, "mm"),
        has(s) && lo("S′", s!, 9.5, "cm/s", 1),
        has(eda, esa) && lo("FAC", ((eda! - esa!) / eda!) * 100, 35, "%"),
        has(tco, et) && { label: "RIMP (TDI)", value: (tco! - et!) / et!, digits: 2, level: (tco! - et!) / et! > 0.54 ? 1 : 0, tag: (tco! - et!) / et! > 0.54 ? "Abnormal" : "Normal" },
      ]);
    },
    formula: ["FAC = (EDA − ESA) ÷ EDA × 100", "RIMP = (TCO − ET) ÷ ET"],
    reference: { cols: ["Measure", "Abnormal"], rows: [["TAPSE", "< 17 mm"], ["S′ (TDI)", "< 9.5 cm/s"], ["FAC", "< 35%"], ["RIMP (TDI)", "> 0.54"], ["RIMP (PW)", "> 0.43"]] },
    source: "ASE/EACVI chamber quantification 2015",
    example: { tapse: 14, s: 8.2, eda: 24, esa: 17, tco: 430, et: 270 },
  },
  {
    id: "rvsp",
    cat: "Right ventricle",
    title: "RVSP and PH probability",
    blurb: "From TR peak velocity and RA pressure",
    fields: [
      { key: "trv", label: "TR peak velocity", unit: "m/s" },
      {
        key: "rap",
        label: "RA pressure (IVC)",
        options: [
          { value: "3", label: "IVC ≤ 2.1 cm, collapses > 50% · 3 mmHg" },
          { value: "8", label: "In between · 8 mmHg" },
          { value: "15", label: "IVC > 2.1 cm, collapses < 50% · 15 mmHg" },
        ],
      },
    ],
    compute: ({ trv }, { rap }) => {
      if (!has(trv)) return [];
      const p = 4 * trv! ** 2 + Number(rap || 3);
      const lvl: Level = trv! <= 2.8 ? 0 : trv! <= 3.4 ? 2 : 3;
      return [
        { label: "RV–RA gradient", value: 4 * trv! ** 2, unit: "mmHg", digits: 0 },
        { label: "RVSP (≈ PASP)", value: p, unit: "mmHg", digits: 0 },
        { label: "Echo probability of PH", text: ["Low", "", "Intermediate", "High"][lvl], level: lvl, tag: ["Low", "", "Intermediate", "High"][lvl] },
      ];
    },
    formula: ["RVSP = 4 × TRV² + RAP"],
    note: "Probability uses TR velocity alone. Other signs (RV/LV ratio > 1, flat septum, RVOT AT < 105 ms or notching, PA > 2.5 cm, IVC) move it up a level.",
    reference: { cols: ["TR velocity", "PH probability"], rows: [["≤ 2.8 m/s", "Low (if no other signs)"], ["2.9–3.4 m/s", "Intermediate"], ["> 3.4 m/s", "High"]] },
    source: "ESC/ERS pulmonary hypertension 2022; ASE 2010",
    example: { trv: 3.6, rap: "8" },
  },
  {
    id: "mpap",
    cat: "Right ventricle",
    title: "Mean PA pressure",
    blurb: "From RVOT acceleration time or PR velocity",
    fields: [
      { key: "at", label: "RVOT acceleration time", unit: "ms", optional: true },
      { key: "pre", label: "PR early-diastolic velocity", unit: "m/s", optional: true },
      { key: "prl", label: "PR end-diastolic velocity", unit: "m/s", optional: true },
      { key: "rap", label: "RA pressure", unit: "mmHg", optional: true },
    ],
    compute: ({ at, pre, prl, rap }) => {
      const ra = has(rap) ? rap! : 3;
      return out([
        has(at) && { label: "mPAP from AT", value: 79 - 0.45 * at!, unit: "mmHg", digits: 0, level: 79 - 0.45 * at! > 20 ? 2 : 0, tag: 79 - 0.45 * at! > 20 ? "Raised" : "Normal" },
        has(at) && { label: "RVOT AT", value: at!, unit: "ms", digits: 0, level: at! < 105 ? 2 : 0, tag: at! < 105 ? "Short: suggests PH" : "Normal" },
        has(pre) && { label: "mPAP from PR", value: 4 * pre! ** 2 + ra, unit: "mmHg", digits: 0, level: 4 * pre! ** 2 + ra > 20 ? 2 : 0, tag: 4 * pre! ** 2 + ra > 20 ? "Raised" : "Normal" },
        has(prl) && { label: "PA diastolic pressure", value: 4 * prl! ** 2 + ra, unit: "mmHg", digits: 0 },
      ]);
    },
    formula: ["mPAP = 79 − 0.45 × AT (Mahan)", "mPAP ≈ 4 × PR early velocity² + RAP", "PADP = 4 × PR end velocity² + RAP"],
    note: "PH is defined as mPAP > 20 mmHg at right heart catheterisation. Echo estimates are approximate. RAP defaults to 3 mmHg if left empty.",
    source: "Mahan 1983; ASE 2010; ESC/ERS 2022",
    example: { at: 85, pre: 2.4, prl: 1.6, rap: 8 },
  },
  {
    id: "pvr",
    cat: "Right ventricle",
    title: "PVR estimate",
    blurb: "TR velocity ÷ RVOT VTI",
    fields: [
      { key: "trv", label: "TR peak velocity", unit: "m/s" },
      { key: "vti", label: "RVOT VTI", unit: "cm" },
    ],
    compute: ({ trv, vti }) => {
      if (!has(trv, vti)) return [];
      const ratio = trv! / vti!, pvr = 10 * ratio + 0.16;
      return [
        { label: "TRV / RVOT VTI", value: ratio, digits: 3, level: ratio > 0.175 ? 2 : 0, tag: ratio > 0.175 ? "Suggests PVR > 2 WU" : "Normal" },
        { label: "PVR", value: pvr, unit: "Wood units", digits: 1, level: pvr > 2 ? 2 : 0, tag: pvr > 2 ? "Raised" : "Normal" },
      ];
    },
    formula: ["PVR ≈ 10 × (TRV ÷ RVOT VTI) + 0.16"],
    note: "Validated for PVR up to about 8 WU; less reliable when PVR is very high.",
    source: "Abbas et al. JACC 2003; ESC/ERS 2022",
    example: { trv: 3.4, vti: 14 },
  },

  // ---------------- Left ventricle ----------------
  {
    id: "lv-mass",
    cat: "Left ventricle",
    title: "LV mass and geometry",
    blurb: "Linear method, RWT and pattern",
    fields: [
      { key: "ivs", label: "IVSd", unit: "cm" },
      { key: "lvid", label: "LVIDd", unit: "cm" },
      { key: "pw", label: "LVPWd", unit: "cm" },
      { ...BSA, optional: false, hint: "needed for LVMi" },
      SEX,
    ],
    compute: ({ ivs, lvid, pw, bsa }, { sex }) => {
      if (!has(ivs, lvid, pw)) return [];
      const mass = 0.8 * 1.04 * ((ivs! + lvid! + pw!) ** 3 - lvid! ** 3) + 0.6, rwt = (2 * pw!) / lvid!;
      const r: Result[] = [
        { label: "LV mass", value: mass, unit: "g", digits: 0 },
        { label: "RWT", value: rwt, digits: 2, level: rwt > 0.42 ? 1 : 0, tag: rwt > 0.42 ? "Increased" : "Normal" },
      ];
      if (has(bsa)) {
        const i = mass / bsa!, f = sex === "f";
        const lvl = f ? tier(i, [96, 109, 122]) : tier(i, [116, 132, 149]);
        r.push({ label: "LVMi", value: i, unit: "g/m²", digits: 0, level: lvl });
        const lvh = lvl > 0, conc = rwt > 0.42;
        r.push({ label: "Geometry", text: lvh ? (conc ? "Concentric hypertrophy" : "Eccentric hypertrophy") : conc ? "Concentric remodelling" : "Normal geometry", level: lvh ? 2 : conc ? 1 : 0, tag: lvh ? "LVH" : conc ? "Remodelling" : "Normal" });
      }
      return r;
    },
    formula: ["LV mass = 0.8 × 1.04 × [(IVSd + LVIDd + LVPWd)³ − LVIDd³] + 0.6 g", "RWT = 2 × LVPWd ÷ LVIDd", "LVMi = LV mass ÷ BSA"],
    reference: {
      cols: ["LVMi (g/m²)", "Women", "Men"],
      rows: [["Normal", "43–95", "49–115"], ["Mild", "96–108", "116–131"], ["Moderate", "109–121", "132–148"], ["Severe", "≥ 122", "≥ 149"]],
      caption: "RWT > 0.42 = concentric",
    },
    source: "ASE/EACVI chamber quantification 2015",
    example: { ivs: 1.3, lvid: 4.8, pw: 1.2, bsa: 1.9, sex: "m" },
  },
  {
    id: "lv-size",
    cat: "Left ventricle",
    title: "LV size and FS",
    blurb: "Linear dimensions, FS and Teichholz EF",
    fields: [{ key: "edd", label: "LVIDd", unit: "cm" }, { key: "esd", label: "LVIDs", unit: "cm", optional: true }, BSA, SEX],
    compute: ({ edd, esd, bsa }, { sex }) => {
      if (!has(edd)) return [];
      const f = sex === "f", tv = (d: number) => (7 / (2.4 + d)) * d ** 3;
      return out([
        { label: "LVIDd", value: edd!, unit: "cm", digits: 1, level: f ? tier(edd!, [5.3, 5.7, 6.2]) : tier(edd!, [5.9, 6.4, 6.9]) },
        has(bsa) && { label: "LVIDd / BSA", value: edd! / bsa!, unit: "cm/m²", digits: 1 },
        has(esd) && { label: "Fractional shortening", value: ((edd! - esd!) / edd!) * 100, unit: "%", digits: 0, level: ((edd! - esd!) / edd!) * 100 < 25 ? 2 : 0, tag: ((edd! - esd!) / edd!) * 100 < 25 ? "Reduced" : "Normal" },
        has(esd) && { label: "EF (Teichholz)", value: ((tv(edd!) - tv(esd!)) / tv(edd!)) * 100, unit: "%", digits: 0 },
      ]);
    },
    formula: ["FS = (LVIDd − LVIDs) ÷ LVIDd × 100", "Teichholz V = 7 ÷ (2.4 + D) × D³"],
    note: "Teichholz assumes a normally shaped LV; use Simpson's biplane when there are regional wall-motion abnormalities.",
    reference: {
      cols: ["LVIDd (cm)", "Women", "Men"],
      rows: [["Normal", "3.8–5.2", "4.2–5.8"], ["Mild", "5.3–5.6", "5.9–6.3"], ["Moderate", "5.7–6.1", "6.4–6.8"], ["Severe", "≥ 6.2", "≥ 6.9"]],
      caption: "Normal FS 25–43%",
    },
    source: "ASE/EACVI chamber quantification 2015",
    example: { edd: 6.1, esd: 4.9, bsa: 1.9, sex: "m" },
  },
  {
    id: "simpson",
    cat: "Left ventricle",
    title: "EF · Simpson biplane",
    blurb: "EF, stroke volume and volume indices",
    fields: [{ key: "edv", label: "LV end-diastolic volume", unit: "mL" }, { key: "esv", label: "LV end-systolic volume", unit: "mL" }, BSA, SEX],
    compute: ({ edv, esv, bsa }, { sex }) => {
      if (!has(edv, esv)) return [];
      const ef = Math.round(((edv! - esv!) / edv!) * 100), f = sex === "f"; // grade the value that is shown
      const lvl: Level = ef >= (f ? 54 : 52) ? 0 : ef >= 41 ? 1 : ef >= 30 ? 2 : 3;
      return out([
        { label: "EF", value: ef, unit: "%", digits: 0, level: lvl, tag: lvl === 0 ? "Normal" : ["", "Mildly reduced", "Moderately reduced", "Severely reduced"][lvl] },
        { label: "Stroke volume", value: edv! - esv!, unit: "mL", digits: 0 },
        has(bsa) && { label: "EDVi", value: edv! / bsa!, unit: "mL/m²", digits: 0, level: edv! / bsa! > (f ? 61 : 74) ? 1 : 0, tag: edv! / bsa! > (f ? 61 : 74) ? "Dilated" : "Normal" },
        has(bsa) && { label: "ESVi", value: esv! / bsa!, unit: "mL/m²", digits: 0, level: esv! / bsa! > (f ? 24 : 31) ? 1 : 0, tag: esv! / bsa! > (f ? 24 : 31) ? "Increased" : "Normal" },
      ]);
    },
    formula: ["EF = (EDV − ESV) ÷ EDV × 100", "SV = EDV − ESV"],
    reference: {
      cols: ["Measure", "Women", "Men"],
      rows: [["Normal EF", "54–74%", "52–72%"], ["Mildly reduced", "41–53%", "41–51%"], ["Moderately reduced", "30–40%", "30–40%"], ["Severely reduced", "< 30%", "< 30%"], ["EDVi upper limit", "61 mL/m²", "74 mL/m²"], ["ESVi upper limit", "24 mL/m²", "31 mL/m²"]],
    },
    source: "ASE/EACVI chamber quantification 2015",
    example: { edv: 160, esv: 95, bsa: 1.9, sex: "m" },
  },
  {
    id: "stroke-volume",
    cat: "Left ventricle",
    title: "Stroke volume and output",
    blurb: "LVOT diameter × VTI",
    fields: [{ key: "d", label: "LVOT diameter", unit: "cm" }, { key: "vti", label: "LVOT VTI", unit: "cm" }, { key: "hr", label: "Heart rate", unit: "bpm", optional: true }, BSA],
    compute: ({ d, vti, hr, bsa }) => {
      if (!has(d, vti)) return [];
      const sv = area(d!) * vti!, co = has(hr) ? (sv * hr!) / 1000 : undefined;
      return out([
        { label: "LVOT area", value: area(d!), unit: "cm²", digits: 2 },
        { label: "Stroke volume", value: sv, unit: "mL", digits: 0 },
        has(bsa) && { label: "SVi", value: sv / bsa!, unit: "mL/m²", digits: 0, level: sv / bsa! < 35 ? 2 : 0, tag: sv / bsa! < 35 ? "Low flow" : "Normal" },
        co !== undefined && { label: "Cardiac output", value: co, unit: "L/min", digits: 1 },
        co !== undefined && has(bsa) && { label: "Cardiac index", value: co / bsa!, unit: "L/min/m²", digits: 1, level: co / bsa! < 2.2 ? 2 : 0, tag: co / bsa! < 2.2 ? "Low" : "Normal" },
        { label: "LVOT VTI", value: vti!, unit: "cm", digits: 0, level: vti! < 18 ? 1 : 0, tag: vti! < 18 ? "Low" : "Normal" },
      ]);
    },
    formula: ["SV = π × (LVOT d ÷ 2)² × LVOT VTI", "CO = SV × HR", "CI = CO ÷ BSA"],
    note: "Errors in LVOT diameter are squared. Measure it in mid-systole, inner edge to inner edge, just below the cusps.",
    source: "ASE Doppler quantification 2002",
    example: { d: 2.1, vti: 20, hr: 72, bsa: 1.9 },
  },

  // ---------------- Aortic valve ----------------
  {
    id: "aortic-stenosis",
    cat: "Aortic valve",
    title: "Aortic stenosis",
    blurb: "Vmax, gradients, continuity AVA, DVI",
    fields: [
      { key: "vmax", label: "AV peak velocity", unit: "m/s" },
      { key: "mg", label: "Mean gradient", unit: "mmHg", optional: true },
      { key: "d", label: "LVOT diameter", unit: "cm", optional: true },
      { key: "lvti", label: "LVOT VTI", unit: "cm", optional: true },
      { key: "avti", label: "AV VTI", unit: "cm", optional: true },
      BSA,
    ],
    compute: ({ vmax, mg, d, lvti, avti, bsa }) => {
      const sev = (l: Level) => (l === 0 ? "Sclerosis / none" : LEVEL_NAMES[l]);
      const ava = has(d, lvti, avti) ? (area(d!) * lvti!) / avti! : undefined;
      return out([
        has(vmax) && { label: "Vmax", value: vmax!, unit: "m/s", digits: 1, level: tier(vmax!, [2, 3, 4]), tag: sev(tier(vmax!, [2, 3, 4])) },
        has(vmax) && { label: "Peak gradient", value: 4 * vmax! ** 2, unit: "mmHg", digits: 0 },
        has(mg) && { label: "Mean gradient", value: mg!, unit: "mmHg", digits: 0, level: mg! < 20 ? 1 : mg! < 40 ? 2 : 3 },
        ava !== undefined && { label: "AVA (continuity)", value: ava, unit: "cm²", digits: 2, level: ava > 1.5 ? 1 : ava >= 1.0 ? 2 : 3 },
        ava !== undefined && has(bsa) && { label: "AVAi", value: ava / bsa!, unit: "cm²/m²", digits: 2, level: ava / bsa! < 0.6 ? 3 : 1, tag: ava / bsa! < 0.6 ? "Severe" : "Not severe" },
        has(lvti, avti) && { label: "DVI (VTI ratio)", value: lvti! / avti!, digits: 2, level: lvti! / avti! < 0.25 ? 3 : 1, tag: lvti! / avti! < 0.25 ? "Severe" : "Not severe" },
      ]);
    },
    formula: ["AVA = π × (LVOT d ÷ 2)² × LVOT VTI ÷ AV VTI", "DVI = LVOT VTI ÷ AV VTI", "Peak gradient = 4 × Vmax²"],
    note: "Discordant grading (AVA < 1.0 cm² but mean gradient < 40 mmHg): check SVi < 35 mL/m² for low-flow, low-gradient AS.",
    reference: {
      cols: ["", "Mild", "Moderate", "Severe"],
      rows: [["Vmax (m/s)", "2.0–2.9", "3.0–3.9", "≥ 4.0"], ["Mean gradient (mmHg)", "< 20", "20–39", "≥ 40"], ["AVA (cm²)", "> 1.5", "1.0–1.5", "< 1.0"], ["AVAi (cm²/m²)", "", "", "< 0.6"], ["DVI", "", "", "< 0.25"]],
    },
    source: "ACC/AHA valvular heart disease 2020; ASE/EACVI AS 2017",
    example: { vmax: 4.3, mg: 46, d: 2.1, lvti: 20, avti: 98, bsa: 1.85 },
  },
  {
    id: "aortic-regurgitation",
    cat: "Aortic valve",
    title: "Aortic regurgitation",
    blurb: "PHT, vena contracta, jet width",
    fields: [
      { key: "pht", label: "AR pressure half-time", unit: "ms", optional: true },
      { key: "vc", label: "Vena contracta", unit: "cm", optional: true },
      { key: "jw", label: "Jet width", unit: "cm", optional: true },
      { key: "lvot", label: "LVOT diameter", unit: "cm", optional: true },
      { key: "edv", label: "Desc. aorta end-diastolic velocity", unit: "cm/s", hint: "holodiastolic reversal", optional: true },
    ],
    compute: ({ pht, vc, jw, lvot, edv }) =>
      out([
        has(pht) && { label: "Pressure half-time", value: pht!, unit: "ms", digits: 0, level: pht! > 500 ? 1 : pht! >= 200 ? 2 : 3 },
        has(vc) && { label: "Vena contracta", value: vc!, unit: "cm", digits: 2, level: vc! < 0.3 ? 1 : vc! <= 0.6 ? 2 : 3 },
        has(jw, lvot) && { label: "Jet width / LVOT", value: (jw! / lvot!) * 100, unit: "%", digits: 0, level: (jw! / lvot!) * 100 < 25 ? 1 : (jw! / lvot!) * 100 < 65 ? 2 : 3 },
        has(edv) && { label: "End-diastolic reversal", value: edv!, unit: "cm/s", digits: 0, level: edv! > 20 ? 3 : 1, tag: edv! > 20 ? "Severe" : "Not severe" },
      ]),
    formula: ["Jet width ratio = AR jet width ÷ LVOT diameter × 100"],
    note: "Grade from several parameters together: a single measure can mislead (PHT also shortens when LV diastolic pressure is high).",
    reference: {
      cols: ["", "Mild", "Moderate", "Severe"],
      rows: [["PHT (ms)", "> 500", "200–500", "< 200"], ["Vena contracta (cm)", "< 0.3", "0.3–0.6", "> 0.6"], ["Jet width / LVOT", "< 25%", "25–64%", "≥ 65%"], ["Desc. aorta reversal", "", "", "EDV > 20 cm/s"]],
    },
    source: "ASE native valvular regurgitation 2017",
    example: { pht: 240, vc: 0.55, jw: 1.1, lvot: 2.2, edv: 16 },
  },

  // ---------------- Mitral valve ----------------
  {
    id: "mitral-stenosis",
    cat: "Mitral valve",
    title: "Mitral stenosis",
    blurb: "MVA by pressure half-time",
    fields: [
      { key: "pht", label: "Pressure half-time", unit: "ms", optional: true },
      { key: "mg", label: "Mean gradient", unit: "mmHg", optional: true },
      { key: "plan", label: "Planimetered MVA", unit: "cm²", optional: true },
      { key: "hr", label: "Heart rate", unit: "bpm", hint: "gradient depends on HR", optional: true },
    ],
    compute: ({ pht, mg, plan, hr }) => {
      const g = (a: number): Level => (a > 1.5 ? 1 : a > 1.0 ? 2 : 3);
      const tag = (a: number) => (a > 1.5 ? "Not severe" : a > 1.0 ? "Severe" : "Very severe");
      return out([
        has(pht) && { label: "MVA (220 ÷ PHT)", value: 220 / pht!, unit: "cm²", digits: 2, level: g(220 / pht!), tag: tag(220 / pht!) },
        has(plan) && { label: "MVA (planimetry)", value: plan!, unit: "cm²", digits: 2, level: g(plan!), tag: tag(plan!) },
        has(mg) && { label: "Mean gradient", value: mg!, unit: "mmHg", digits: 0, level: mg! < 5 ? 1 : mg! <= 10 ? 2 : 3, tag: mg! < 5 ? "Mild" : mg! <= 10 ? "Moderate" : "Severe" },
        has(hr) && { label: "Heart rate", value: hr!, unit: "bpm", digits: 0 },
      ]);
    },
    formula: ["MVA = 220 ÷ PHT"],
    note: "PHT is unreliable straight after balloon valvotomy, with significant AR, or with abnormal LV compliance. Report the heart rate with the gradient.",
    reference: { cols: ["MVA", "Stage"], rows: [["> 1.5 cm²", "Progressive (not severe)"], ["≤ 1.5 cm² (PHT ≥ 150 ms)", "Severe"], ["≤ 1.0 cm² (PHT ≥ 220 ms)", "Very severe"]] },
    source: "ACC/AHA valvular heart disease 2020; EAE/ASE MS 2009",
    example: { pht: 240, mg: 11, hr: 78 },
  },
  {
    id: "mitral-regurgitation",
    cat: "Mitral valve",
    title: "Mitral regurgitation",
    blurb: "PISA EROA, regurgitant volume, VC",
    fields: [
      { key: "r", label: "PISA radius", unit: "cm", optional: true },
      { key: "va", label: "Aliasing velocity", unit: "cm/s", optional: true },
      { key: "vmax", label: "MR peak velocity", unit: "m/s", optional: true },
      { key: "vti", label: "MR VTI", unit: "cm", optional: true },
      { key: "vc", label: "Vena contracta", unit: "cm", optional: true },
    ],
    compute: ({ r, va, vmax, vti, vc }) => {
      const eroa = has(r, va, vmax) ? (2 * Math.PI * r! ** 2 * va!) / (vmax! * 100) : undefined;
      return out([
        eroa !== undefined && { label: "EROA", value: eroa, unit: "cm²", digits: 2, level: eroa < 0.2 ? 1 : eroa < 0.4 ? 2 : 3 },
        eroa !== undefined && has(vti) && { label: "Regurgitant volume", value: eroa * vti!, unit: "mL", digits: 0, level: eroa * vti! < 30 ? 1 : eroa * vti! < 60 ? 2 : 3 },
        has(vc) && { label: "Vena contracta", value: vc!, unit: "cm", digits: 2, level: vc! < 0.3 ? 1 : vc! < 0.7 ? 2 : 3 },
      ]);
    },
    formula: ["EROA = 2π × r² × Va ÷ Vmax", "RVol = EROA × MR VTI"],
    note: "Use a central, holosystolic jet with a hemispheric PISA. Shift the colour baseline toward the jet (Va about 30–40 cm/s).",
    reference: {
      cols: ["", "Mild", "Moderate", "Severe"],
      rows: [["EROA (cm²)", "< 0.20", "0.20–0.39", "≥ 0.40"], ["RVol (mL)", "< 30", "30–59", "≥ 60"], ["Vena contracta (cm)", "< 0.3", "0.3–0.69", "≥ 0.7"]],
    },
    source: "ASE native valvular regurgitation 2017",
    example: { r: 0.9, va: 38, vmax: 5.1, vti: 150, vc: 0.65 },
  },

  // ---------------- Tricuspid valve ----------------
  {
    id: "tricuspid-regurgitation",
    cat: "Tricuspid valve",
    title: "Tricuspid regurgitation",
    blurb: "VC, PISA EROA and volume",
    fields: [
      { key: "vc", label: "Vena contracta", unit: "cm", optional: true },
      { key: "r", label: "PISA radius", unit: "cm", optional: true },
      { key: "va", label: "Aliasing velocity", unit: "cm/s", optional: true },
      { key: "vmax", label: "TR peak velocity", unit: "m/s", optional: true },
      { key: "vti", label: "TR VTI", unit: "cm", optional: true },
    ],
    compute: ({ vc, r, va, vmax, vti }) => {
      const eroa = has(r, va, vmax) ? (2 * Math.PI * r! ** 2 * va!) / (vmax! * 100) : undefined;
      return out([
        has(vc) && { label: "Vena contracta", value: vc!, unit: "cm", digits: 2, level: vc! < 0.3 ? 1 : vc! < 0.7 ? 2 : 3, tag: vc! >= 2.1 ? "Torrential" : vc! >= 1.4 ? "Massive" : undefined },
        eroa !== undefined && { label: "EROA", value: eroa, unit: "cm²", digits: 2, level: eroa < 0.2 ? 1 : eroa < 0.4 ? 2 : 3 },
        eroa !== undefined && has(vti) && { label: "Regurgitant volume", value: eroa * vti!, unit: "mL", digits: 0, level: eroa * vti! < 30 ? 1 : eroa * vti! < 45 ? 2 : 3 },
      ]);
    },
    formula: ["EROA = 2π × r² × Va ÷ Vmax", "RVol = EROA × TR VTI"],
    note: "Beyond severe, VC 1.4–2.0 cm is often called massive and ≥ 2.1 cm torrential. Check for systolic hepatic vein flow reversal.",
    reference: {
      cols: ["", "Mild", "Moderate", "Severe"],
      rows: [["Vena contracta (cm)", "< 0.3", "0.3–0.69", "≥ 0.7"], ["EROA (cm²)", "< 0.20", "0.20–0.39", "≥ 0.40"], ["RVol (mL)", "< 30", "30–44", "≥ 45"]],
    },
    source: "ASE native valvular regurgitation 2017; Hahn & Zamorano 2017",
    example: { vc: 0.9, r: 1.0, va: 28, vmax: 2.7, vti: 70 },
  },

  // ---------------- Pulmonary valve ----------------
  {
    id: "pulmonary-stenosis",
    cat: "Pulmonary valve",
    title: "Pulmonary stenosis",
    blurb: "Peak velocity and gradient",
    fields: [{ key: "v", label: "PV peak velocity", unit: "m/s" }],
    compute: ({ v }) =>
      has(v)
        ? [
            { label: "Peak velocity", value: v!, unit: "m/s", digits: 1, level: v! < 3 ? 1 : v! <= 4 ? 2 : 3 },
            { label: "Peak gradient", value: 4 * v! ** 2, unit: "mmHg", digits: 0, level: 4 * v! ** 2 < 36 ? 1 : 4 * v! ** 2 <= 64 ? 2 : 3 },
          ]
        : [],
    formula: ["Peak gradient = 4 × V²"],
    reference: { cols: ["", "Mild", "Moderate", "Severe"], rows: [["Peak velocity (m/s)", "< 3", "3–4", "> 4"], ["Peak gradient (mmHg)", "< 36", "36–64", "> 64"]] },
    source: "EAE/ASE valve stenosis 2009",
    example: { v: 3.6 },
  },

  // ---------------- Diastology ----------------
  {
    id: "diastolic-function",
    cat: "Diastology",
    title: "Diastolic function",
    blurb: "ASE/EACVI 2016 algorithm",
    fields: [
      {
        key: "ef",
        label: "LV systolic function",
        options: [
          { value: "normal", label: "Normal EF, no myocardial disease" },
          { value: "reduced", label: "Reduced EF or myocardial disease" },
        ],
      },
      { key: "e", label: "Mitral E", unit: "cm/s" },
      { key: "a", label: "Mitral A", unit: "cm/s", optional: true },
      { key: "sep", label: "Septal e′", unit: "cm/s", optional: true },
      { key: "lat", label: "Lateral e′", unit: "cm/s", optional: true },
      { key: "trv", label: "TR peak velocity", unit: "m/s", optional: true },
      { key: "lavi", label: "LAVi", unit: "mL/m²", optional: true },
    ],
    compute: ({ e, a, sep, lat, trv, lavi }, { ef }) => {
      if (!has(e)) return [];
      const ep = has(sep, lat) ? (sep! + lat!) / 2 : has(sep) ? sep! : has(lat) ? lat! : undefined;
      const ee = ep !== undefined ? e! / ep : undefined, ea = has(a) ? e! / a! : undefined;
      const r: Result[] = [];
      if (ea !== undefined) r.push({ label: "E/A", value: ea, digits: 1 });
      if (ee !== undefined) r.push({ label: "Average E/e′", value: ee, digits: 1, level: ee > 14 ? 2 : 0, tag: ee > 14 ? "Raised" : "Normal" });

      let dysfunction = ef === "reduced";
      if (ef !== "reduced") {
        // Normal EF: four criteria, more than half abnormal = diastolic dysfunction
        const crit = [
          has(sep) || has(lat) ? (has(sep) && sep! < 7) || (has(lat) && lat! < 10) : undefined,
          ee !== undefined ? ee > 14 : undefined,
          has(trv) ? trv! > 2.8 : undefined,
          has(lavi) ? lavi! > 34 : undefined,
        ].filter((x) => x !== undefined) as boolean[];
        if (crit.length < 2) return [...r, { label: "Result", text: "Enter at least two of e′, TR velocity and LAVi" }];
        const pos = crit.filter(Boolean).length;
        if (pos * 2 < crit.length) return [...r, { label: "Diastolic function", text: `Normal (${pos} of ${crit.length} criteria)`, level: 0, tag: "Normal" }];
        if (pos * 2 === crit.length) return [...r, { label: "Diastolic function", text: `Indeterminate (${pos} of ${crit.length} criteria)`, level: 1, tag: "Indeterminate" }];
        r.push({ label: "Diastolic function", text: `Dysfunction (${pos} of ${crit.length} criteria)`, level: 2, tag: "Dysfunction" });
        dysfunction = true;
      }
      if (dysfunction) {
        if (ea === undefined) return [...r, { label: "Grade", text: "Enter mitral A to grade" }];
        if (ea <= 0.8 && e! <= 50) r.push({ label: "Grade", text: "Grade I · normal LA pressure", level: 1, tag: "Grade I" });
        else if (ea >= 2) r.push({ label: "Grade", text: "Grade III · raised LA pressure", level: 3, tag: "Grade III" });
        else {
          const c = [ee !== undefined ? ee > 14 : undefined, has(trv) ? trv! > 2.8 : undefined, has(lavi) ? lavi! > 34 : undefined].filter((x) => x !== undefined) as boolean[];
          const pos = c.filter(Boolean).length, neg = c.length - pos;
          if (pos >= 2) r.push({ label: "Grade", text: "Grade II · raised LA pressure", level: 2, tag: "Grade II" });
          else if (neg >= 2) r.push({ label: "Grade", text: "Grade I · normal LA pressure", level: 1, tag: "Grade I" });
          else r.push({ label: "Grade", text: "Cannot grade: need more of E/e′, TR velocity and LAVi", level: 1, tag: "Indeterminate" });
        }
      }
      return r;
    },
    formula: ["Normal EF criteria: septal e′ < 7 or lateral e′ < 10 cm/s · average E/e′ > 14 · TR velocity > 2.8 m/s · LAVi > 34 mL/m²", "Grading: E/A ≤ 0.8 and E ≤ 50 → grade I · E/A ≥ 2 → grade III · otherwise 2 of 3 (E/e′, TR, LAVi) decide"],
    note: "Not valid in AF, significant mitral disease, mitral annular calcification, prosthetic valves or LVADs.",
    source: "ASE/EACVI diastolic function 2016",
    example: { ef: "normal", e: 95, a: 60, sep: 5.5, lat: 8, trv: 3.0, lavi: 40 },
  },

  // ---------------- Pericardium ----------------
  {
    id: "pericardial",
    cat: "Pericardium",
    title: "Effusion and tamponade",
    blurb: "Size and respiratory variation",
    fields: [
      { key: "depth", label: "Effusion depth (diastole)", unit: "cm", optional: true },
      { key: "mexp", label: "Mitral E · expiration", unit: "cm/s", optional: true },
      { key: "mins", label: "Mitral E · inspiration", unit: "cm/s", optional: true },
      { key: "texp", label: "Tricuspid E · expiration", unit: "cm/s", optional: true },
      { key: "tins", label: "Tricuspid E · inspiration", unit: "cm/s", optional: true },
    ],
    compute: ({ depth, mexp, mins, texp, tins }) =>
      out([
        has(depth) && { label: "Effusion", value: depth!, unit: "cm", digits: 1, level: depth! < 1 ? 1 : depth! <= 2 ? 2 : 3, tag: depth! < 1 ? "Small" : depth! <= 2 ? "Moderate" : "Large" },
        has(mexp, mins) && { label: "Mitral E variation", value: ((mexp! - mins!) / mexp!) * 100, unit: "%", digits: 0, level: ((mexp! - mins!) / mexp!) * 100 > 25 ? 3 : 0, tag: ((mexp! - mins!) / mexp!) * 100 > 25 ? "Exaggerated" : "Normal" },
        has(texp, tins) && { label: "Tricuspid E variation", value: ((tins! - texp!) / texp!) * 100, unit: "%", digits: 0, level: ((tins! - texp!) / texp!) * 100 > 40 ? 3 : 0, tag: ((tins! - texp!) / texp!) * 100 > 40 ? "Exaggerated" : "Normal" },
      ]),
    formula: ["Mitral variation = (E exp − E insp) ÷ E exp × 100", "Tricuspid variation = (E insp − E exp) ÷ E exp × 100"],
    note: "Tamponade is a clinical diagnosis. Support it with RA and RV diastolic collapse and a plethoric IVC; exaggerated variation is also seen in constriction.",
    reference: { cols: ["Measure", "Cut-off"], rows: [["Small effusion", "< 1 cm"], ["Moderate", "1–2 cm"], ["Large", "> 2 cm"], ["Mitral E fall on inspiration", "> 25%"], ["Tricuspid E rise on inspiration", "> 40%"]] },
    source: "ASE pericardial disease 2013",
    example: { depth: 2.3, mexp: 90, mins: 60, texp: 40, tins: 62 },
  },

  // ---------------- Shunts ----------------
  {
    id: "qp-qs",
    cat: "Shunts",
    title: "Qp:Qs",
    blurb: "Pulmonary to systemic flow ratio",
    fields: [
      { key: "rd", label: "RVOT diameter", unit: "cm" },
      { key: "rvti", label: "RVOT VTI", unit: "cm" },
      { key: "ld", label: "LVOT diameter", unit: "cm" },
      { key: "lvti", label: "LVOT VTI", unit: "cm" },
    ],
    compute: ({ rd, rvti, ld, lvti }) => {
      if (!has(rd, rvti, ld, lvti)) return [];
      const qp = area(rd!) * rvti!, qs = area(ld!) * lvti!, q = qp / qs;
      return [
        { label: "Qp (RVOT SV)", value: qp, unit: "mL", digits: 0 },
        { label: "Qs (LVOT SV)", value: qs, unit: "mL", digits: 0 },
        { label: "Qp:Qs", value: q, digits: 2, level: q < 1 ? 1 : q < 1.5 ? 1 : 3, tag: q < 1 ? "Net right-to-left" : q < 1.5 ? "Small shunt" : "Significant (≥ 1.5)" },
      ];
    },
    formula: ["Qp = π × (RVOT d ÷ 2)² × RVOT VTI", "Qs = π × (LVOT d ÷ 2)² × LVOT VTI", "Qp:Qs = Qp ÷ Qs"],
    note: "Small errors in either diameter change the ratio a lot; average several beats.",
    source: "ASE Doppler quantification 2002",
    example: { rd: 2.4, rvti: 22, ld: 2.0, lvti: 19 },
  },
  // ---------------- Strain ----------------
  {
    id: "lv-gls",
    cat: "Strain",
    title: "LV global longitudinal strain",
    blurb: "GLS grade and change from baseline",
    fields: [
      { key: "gls", label: "GLS now", unit: "%", hint: "enter without the minus sign" },
      { key: "base", label: "Baseline GLS", unit: "%", hint: "e.g. before chemotherapy", optional: true },
    ],
    compute: ({ gls, base }) => {
      if (!has(gls)) return [];
      const lvl: Level = gls! >= 18 ? 0 : gls! >= 16 ? 1 : gls! >= 12 ? 2 : 3;
      const drop = has(base) ? ((base! - gls!) / base!) * 100 : undefined;
      return out([
        { label: "GLS", value: -gls!, unit: "%", digits: 1, level: lvl, tag: ["Normal", "Borderline", "Reduced", "Severely reduced"][lvl] },
        drop !== undefined && {
          label: "Relative change from baseline",
          value: -drop,
          unit: "%",
          digits: 0,
          level: drop > 15 ? 3 : drop >= 8 ? 1 : 0,
          tag: drop > 15 ? "Significant fall (> 15%)" : drop >= 8 ? "Borderline (8–15%)" : "Not significant",
        },
      ]);
    },
    formula: ["Relative change = (baseline GLS − current GLS) ÷ baseline GLS × 100"],
    note: "Vendor values differ by 1–2%; follow a patient on the same machine and software. A relative fall > 15% from baseline suggests cancer-therapy cardiac dysfunction.",
    reference: { cols: ["GLS", "Meaning"], rows: [["≤ −18%", "Normal"], ["−16 to −18%", "Borderline"], ["> −16%", "Reduced"]] },
    source: "ASE/EACVI 2015; ESC cardio-oncology 2022",
    example: { gls: 15.2, base: 19.5 },
  },
  {
    id: "la-strain",
    cat: "Strain",
    title: "LA reservoir strain",
    blurb: "LASr and filling pressure",
    fields: [{ key: "lasr", label: "LA reservoir strain", unit: "%" }],
    compute: ({ lasr }) => {
      if (!has(lasr)) return [];
      const lvl: Level = lasr! >= 23 ? 0 : lasr! >= 18 ? 1 : 2;
      return [{ label: "LASr", value: lasr!, unit: "%", digits: 0, level: lvl, tag: ["Normal", "Reduced", "Suggests raised LA pressure"][lvl] }];
    },
    formula: ["LASr = peak positive LA strain (QRS-gated, zero at end-diastole)"],
    note: "Useful when the diastolic algorithm is indeterminate. Normal mean is about 39%; values < 18% point to raised filling pressure.",
    reference: { cols: ["LASr", "Meaning"], rows: [["≥ 23%", "Normal"], ["18–22%", "Reduced"], ["< 18%", "Raised LA pressure likely"]] },
    source: "EACVI LA strain consensus 2018; Pathan et al. JASE 2017",
    example: { lasr: 16 },
  },

  // ---------------- Aorta ----------------
  {
    id: "aortic-size",
    cat: "Aorta",
    title: "Aortic size index",
    blurb: "Ascending aorta indexed to BSA and height",
    fields: [
      { key: "d", label: "Ascending aorta diameter", unit: "cm" },
      BSA,
      { key: "ht", label: "Height", unit: "cm", hint: "for height index", optional: true },
    ],
    compute: ({ d, bsa, ht }) => {
      if (!has(d)) return [];
      const asi = has(bsa) ? d! / bsa! : undefined, ahi = has(ht) ? d! / (ht! / 100) : undefined;
      const risk = ["Low risk", "", "Moderate risk", "High risk"];
      const ra = (x: number, a: number, b: number): Level => (x < a ? 0 : x < b ? 2 : 3);
      return out([
        { label: "Diameter", value: d!, unit: "cm", digits: 1, level: d! < 4 ? 0 : d! < 5 ? 1 : d! < 5.5 ? 2 : 3, tag: d! < 4 ? "Normal" : d! < 5.5 ? "Dilated" : "Surgical range (≥ 5.5)" },
        asi !== undefined && { label: "Aortic size index", value: asi, unit: "cm/m²", digits: 2, level: ra(asi, 2.75, 4.25), tag: risk[ra(asi, 2.75, 4.25)] },
        ahi !== undefined && { label: "Aortic height index", value: ahi, unit: "cm/m", digits: 2, level: ra(ahi, 2.43, 3.22), tag: risk[ra(ahi, 2.43, 3.22)] },
      ]);
    },
    formula: ["ASI = diameter ÷ BSA", "AHI = diameter ÷ height (m)"],
    note: "Risk bands are for yearly dissection, rupture or death in ascending aneurysm. Height index is better in very small or obese patients.",
    reference: {
      cols: ["Risk", "ASI (cm/m²)", "AHI (cm/m)"],
      rows: [["Low (~4%/yr)", "< 2.75", "< 2.43"], ["Moderate (~7%/yr)", "2.75–4.24", "2.43–3.21"], ["High (~20%/yr)", "≥ 4.25", "≥ 3.22"]],
    },
    source: "Davies et al. Ann Thorac Surg 2006; Zafar et al. JTCVS 2018",
    example: { d: 4.8, bsa: 1.7, ht: 165 },
  },

  // ---------------- Prosthetic valves ----------------
  {
    id: "prosthetic-av",
    cat: "Prosthetic valves",
    title: "Prosthetic aortic valve",
    blurb: "DVI, acceleration time, EOAi and mismatch",
    fields: [
      { key: "vmax", label: "Peak velocity", unit: "m/s" },
      { key: "avti", label: "Valve VTI", unit: "cm" },
      { key: "lvti", label: "LVOT VTI", unit: "cm" },
      { key: "at", label: "Acceleration time", unit: "ms", optional: true },
      { key: "ld", label: "LVOT diameter", unit: "cm", hint: "for EOA", optional: true },
      BSA,
    ],
    compute: ({ vmax, avti, lvti, at, ld, bsa }) => {
      const tags = ["Normal", "Possible stenosis", "", "Suggests stenosis"];
      const r: Result[] = [];
      if (has(vmax)) {
        const l: Level = vmax! < 3 ? 0 : vmax! <= 4 ? 1 : 3;
        r.push({ label: "Peak velocity", value: vmax!, unit: "m/s", digits: 1, level: l, tag: tags[l] });
        r.push({ label: "Peak gradient", value: 4 * vmax! ** 2, unit: "mmHg", digits: 0 });
      }
      if (has(avti, lvti)) {
        const dvi = lvti! / avti!, l: Level = dvi >= 0.3 ? 0 : dvi >= 0.25 ? 1 : 3;
        r.push({ label: "DVI", value: dvi, digits: 2, level: l, tag: tags[l] });
      }
      if (has(at)) {
        const l: Level = at! < 80 ? 0 : at! <= 100 ? 1 : 3;
        r.push({ label: "Acceleration time", value: at!, unit: "ms", digits: 0, level: l, tag: tags[l] });
      }
      if (has(avti, lvti, ld)) {
        const eoa = (area(ld!) * lvti!) / avti!, l: Level = eoa > 1.1 ? 0 : eoa >= 0.8 ? 1 : 3;
        r.push({ label: "EOA", value: eoa, unit: "cm²", digits: 2, level: l, tag: tags[l] });
        if (has(bsa)) {
          const i = eoa / bsa!, m: Level = i > 0.85 ? 0 : i > 0.65 ? 2 : 3;
          r.push({ label: "EOAi", value: i, unit: "cm²/m²", digits: 2, level: m, tag: ["No mismatch", "", "Moderate mismatch", "Severe mismatch"][m] });
        }
      }
      return r;
    },
    formula: ["DVI = LVOT VTI ÷ valve VTI", "EOA = π × (LVOT d ÷ 2)² × LVOT VTI ÷ valve VTI", "EOAi = EOA ÷ BSA"],
    note: "A high velocity with a normal DVI and short AT points to high flow or mismatch rather than stenosis. In obese patients (BMI ≥ 30) mismatch cut-offs are 0.70 and 0.55 cm²/m².",
    reference: {
      cols: ["Measure", "Normal", "Possible", "Suggests stenosis"],
      rows: [
        ["Peak velocity", "< 3 m/s", "3–4 m/s", "> 4 m/s"],
        ["DVI", "≥ 0.30", "0.25–0.29", "< 0.25"],
        ["AT", "< 80 ms", "80–100 ms", "> 100 ms"],
        ["EOA", "> 1.1 cm²", "0.8–1.1 cm²", "< 0.8 cm²"],
      ],
      caption: "Mismatch (EOAi): none > 0.85, moderate 0.66–0.85, severe ≤ 0.65 cm²/m².",
    },
    source: "ASE prosthetic valves 2009 and 2024 update",
    example: { vmax: 3.4, avti: 72, lvti: 21, at: 88, ld: 2.1, bsa: 1.9 },
  },

  // ---------------- Haemodynamics ----------------
  {
    id: "regurgitant-fraction",
    cat: "Haemodynamics",
    title: "Regurgitant volume and fraction",
    blurb: "Volumetric method for MR or AR",
    fields: [
      { key: "tsv", label: "Total stroke volume", unit: "mL", hint: "LV volumes or annulus" },
      { key: "fsv", label: "Forward stroke volume", unit: "mL", hint: "LVOT (MR) or RVOT (AR)" },
    ],
    compute: ({ tsv, fsv }) => {
      if (!has(tsv, fsv) || tsv! <= fsv!) return [];
      const rv = tsv! - fsv!, rf = (rv / tsv!) * 100, l = tier(rf, [30, 40, 50]);
      return [
        { label: "Regurgitant volume", value: rv, unit: "mL", digits: 0, level: tier(rv, [30, 45, 60]) },
        { label: "Regurgitant fraction", value: rf, unit: "%", digits: 0, level: l, tag: ["Mild", "Moderate", "Moderate–severe", "Severe"][l] },
      ];
    },
    formula: ["RVol = total SV − forward SV", "RF = RVol ÷ total SV × 100"],
    note: "Total SV from Simpson LV volumes (or mitral annulus area × VTI); forward SV from the LVOT. Grades are for primary MR and AR. Under 30 mL / 30% is graded mild.",
    reference: {
      cols: ["Grade", "RVol", "RF"],
      rows: [["Mild", "< 30 mL", "< 30%"], ["Moderate", "30–44 mL", "30–39%"], ["Moderate–severe", "45–59 mL", "40–49%"], ["Severe", "≥ 60 mL", "≥ 50%"]],
    },
    source: "ASE native valvular regurgitation 2017",
    example: { tsv: 128, fsv: 66 },
  },
  {
    id: "tapse-pasp",
    cat: "Haemodynamics",
    title: "TAPSE/PASP",
    blurb: "RV–PA coupling",
    fields: [
      { key: "tapse", label: "TAPSE", unit: "mm" },
      { key: "pasp", label: "PASP", unit: "mmHg", hint: "or give TR velocity", optional: true },
      { key: "trv", label: "TR peak velocity", unit: "m/s", optional: true },
      { key: "rap", label: "RA pressure", unit: "mmHg", hint: "default 3", optional: true },
    ],
    compute: ({ tapse, pasp, trv, rap }) => {
      const p = has(pasp) ? pasp! : has(trv) ? 4 * trv! ** 2 + (has(rap) ? rap! : 3) : undefined;
      if (!has(tapse) || p === undefined) return [];
      const ratio = tapse! / p, l: Level = ratio >= 0.55 ? 0 : ratio >= 0.32 ? 2 : 3;
      return out([
        !has(pasp) && { label: "PASP", value: p, unit: "mmHg", digits: 0 },
        { label: "TAPSE/PASP", value: ratio, unit: "mm/mmHg", digits: 2, level: l, tag: ["Coupled", "", "Uncoupled", "Severely uncoupled"][l] },
      ]);
    },
    formula: ["PASP = 4 × TRV² + RAP", "Ratio = TAPSE (mm) ÷ PASP (mmHg)"],
    note: "A ratio < 0.55 mm/mmHg raises the probability of PH; < 0.32 is linked to a poor outlook in PH and heart failure.",
    reference: { cols: ["TAPSE/PASP", "Meaning"], rows: [["≥ 0.55", "Normal coupling"], ["0.32–0.54", "Uncoupled"], ["< 0.32", "Severe, high risk"]] },
    source: "ESC/ERS pulmonary hypertension 2022; Tello et al. 2019",
    example: { tapse: 16, trv: 3.5, rap: 8 },
  },
  {
    id: "ivc-rap",
    cat: "Haemodynamics",
    title: "IVC and RA pressure",
    blurb: "IVC size and sniff collapse",
    fields: [
      { key: "dmax", label: "IVC maximum diameter", unit: "cm" },
      { key: "dmin", label: "IVC minimum on sniff", unit: "cm" },
    ],
    compute: ({ dmax, dmin }) => {
      if (!has(dmax, dmin) || dmin! > dmax!) return [];
      const c = ((dmax! - dmin!) / dmax!) * 100, small = dmax! <= 2.1, col = c > 50;
      const rap = small && col ? 3 : !small && !col ? 15 : 8;
      return [
        { label: "Collapse on sniff", value: c, unit: "%", digits: 0, level: col ? 0 : 1, tag: col ? "> 50%" : "≤ 50%" },
        { label: "Estimated RAP", value: rap, unit: "mmHg", digits: 0, level: rap === 3 ? 0 : rap === 8 ? 1 : 3, tag: rap === 3 ? "Normal (0–5)" : rap === 8 ? "Intermediate (5–10)" : "High (10–20)" },
      ];
    },
    formula: ["Collapse = (max − min) ÷ max × 100"],
    note: "Measure 1–2 cm from the RA junction. Not valid in ventilated patients; young athletes may have a large IVC with normal pressure.",
    reference: {
      cols: ["IVC", "Sniff collapse", "RAP"],
      rows: [["≤ 2.1 cm", "> 50%", "3 mmHg (0–5)"], ["≤ 2.1 cm", "≤ 50%", "8 mmHg (5–10)"], ["> 2.1 cm", "> 50%", "8 mmHg (5–10)"], ["> 2.1 cm", "≤ 50%", "15 mmHg (10–20)"]],
    },
    source: "ASE right heart 2010; ASE/EACVI 2015",
    example: { dmax: 2.4, dmin: 1.9 },
  },
  {
    id: "fluid-responsiveness",
    cat: "Haemodynamics",
    title: "Fluid responsiveness (ΔVTI)",
    blurb: "LVOT VTI change after passive leg raise",
    fields: [
      { key: "v0", label: "LVOT VTI at baseline", unit: "cm" },
      { key: "v1", label: "LVOT VTI after leg raise", unit: "cm" },
      { key: "ld", label: "LVOT diameter", unit: "cm", hint: "for stroke volume", optional: true },
      { key: "hr", label: "Heart rate", unit: "bpm", hint: "for cardiac output", optional: true },
    ],
    compute: ({ v0, v1, ld, hr }) => {
      if (!has(v0, v1)) return [];
      const d = ((v1! - v0!) / v0!) * 100;
      return out([
        { label: "ΔVTI", value: d, unit: "%", digits: 0, level: d >= 12 ? 3 : d >= 10 ? 1 : 0, tag: d >= 12 ? "Fluid responsive" : d >= 10 ? "Borderline" : "Not fluid responsive" },
        has(ld) && { label: "Stroke volume (baseline)", value: area(ld!) * v0!, unit: "mL", digits: 0 },
        has(ld, hr) && { label: "Cardiac output (baseline)", value: (area(ld!) * v0! * hr!) / 1000, unit: "L/min", digits: 1 },
      ]);
    },
    formula: ["ΔVTI = (VTI after − VTI before) ÷ VTI before × 100", "SV = π × (LVOT d ÷ 2)² × VTI; CO = SV × HR"],
    note: "Measure VTI within 60–90 s of raising the legs. A rise ≥ 10–15% predicts a response to a fluid bolus. Here the badge colour shows the response, not severity.",
    source: "Monnet et al. Crit Care Med 2006; Lamia et al. 2007",
    example: { v0: 15, v1: 18, ld: 2.0, hr: 98 },
  },
];

export const calcById = (id: string) => CALCS.find((c) => c.id === id);
