// Formula and cut-off checks for the echo calculators. Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { CALCS, CATEGORIES, calcById } from "../src/lib/echo-calculators.ts";

const run = (id, n, s = {}) => calcById(id).compute(n, s);
const get = (res, label) => {
  const r = res.find((x) => x.label === label);
  assert.ok(r, `missing result "${label}"`);
  return r;
};
const near = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} is not within ${tol} of ${b}`);

test("every calculator is well formed and its worked example gives results", () => {
  const ids = new Set();
  for (const c of CALCS) {
    assert.ok(!ids.has(c.id), `duplicate id ${c.id}`);
    ids.add(c.id);
    assert.ok(CATEGORIES.includes(c.cat), `${c.id}: unknown category ${c.cat}`);
    const n = {}, s = {};
    for (const f of c.fields) {
      const v = c.example[f.key];
      if ("options" in f) s[f.key] = v ?? f.options[0].value;
      else if (v !== undefined) n[f.key] = Number(v);
    }
    const res = c.compute(n, s);
    assert.ok(res.length > 0, `${c.id}: worked example gives no results`);
    for (const r of res) if (r.value !== undefined) assert.ok(Number.isFinite(r.value), `${c.id}: ${r.label} is not finite`);
  }
  for (const cat of CATEGORIES) assert.ok(CALCS.some((c) => c.cat === cat), `empty category ${cat}`);
});

test("calculators return nothing when inputs are missing", () => {
  for (const c of CALCS) assert.deepEqual(c.compute({}, {}), [], c.id);
});

test("BSA (Mosteller) and BMI", () => {
  const r = run("bsa", { h: 170, w: 72 });
  near(get(r, "BSA (Mosteller)").value, 1.844, 0.001);
  near(get(r, "BMI").value, 24.9, 0.05);
  assert.equal(get(r, "BMI").tag, "Normal");
});

test("Bernoulli gradients", () => {
  const r = run("bernoulli", { v2: 4, v1: 1 });
  assert.equal(get(r, "Simplified gradient (4V²)").value, 64);
  assert.equal(get(r, "Modified gradient 4(V₂² − V₁²)").value, 60);
});

test("RVSP and PH probability bands", () => {
  near(get(run("rvsp", { trv: 3 }, { rap: "8" }), "RVSP (≈ PASP)").value, 44);
  assert.equal(get(run("rvsp", { trv: 2.8 }, { rap: "3" }), "Echo probability of PH").text, "Low");
  assert.equal(get(run("rvsp", { trv: 3.2 }, { rap: "3" }), "Echo probability of PH").text, "Intermediate");
  assert.equal(get(run("rvsp", { trv: 3.5 }, { rap: "3" }), "Echo probability of PH").text, "High");
});

test("Qp:Qs", () => {
  const r = run("qp-qs", { rd: 2, rvti: 20, ld: 2, lvti: 10 });
  near(get(r, "Qp:Qs").value, 2);
  assert.equal(get(r, "Qp:Qs").level, 3);
});

test("LV GLS grade and relative fall", () => {
  assert.equal(get(run("lv-gls", { gls: 20 }), "GLS").level, 0);
  assert.equal(get(run("lv-gls", { gls: 17 }), "GLS").level, 1);
  assert.equal(get(run("lv-gls", { gls: 14 }), "GLS").level, 2);
  assert.equal(get(run("lv-gls", { gls: 10 }), "GLS").level, 3);
  assert.equal(get(run("lv-gls", { gls: 20 }), "GLS").value, -20);
  const r = run("lv-gls", { gls: 16, base: 20 }); // 20% fall
  near(get(r, "Relative change from baseline").value, -20);
  assert.equal(get(r, "Relative change from baseline").level, 3);
  assert.equal(get(run("lv-gls", { gls: 19, base: 20 }), "Relative change from baseline").level, 0);
});

test("LA reservoir strain", () => {
  assert.equal(get(run("la-strain", { lasr: 30 }), "LASr").level, 0);
  assert.equal(get(run("la-strain", { lasr: 20 }), "LASr").level, 1);
  assert.equal(get(run("la-strain", { lasr: 15 }), "LASr").level, 2);
});

test("Aortic size and height index", () => {
  const r = run("aortic-size", { d: 4.8, bsa: 1.7, ht: 165 });
  near(get(r, "Aortic size index").value, 2.82);
  assert.equal(get(r, "Aortic size index").tag, "Moderate risk");
  near(get(r, "Aortic height index").value, 2.91);
  assert.equal(get(run("aortic-size", { d: 4, bsa: 2 }), "Aortic size index").tag, "Low risk");
  assert.equal(get(run("aortic-size", { d: 6, bsa: 1.4 }), "Aortic size index").tag, "High risk");
});

test("Prosthetic aortic valve: DVI, AT, EOA, EOAi", () => {
  const r = run("prosthetic-av", { vmax: 3.4, avti: 72, lvti: 21, at: 88, ld: 2.1, bsa: 1.9 });
  near(get(r, "DVI").value, 0.29);
  assert.equal(get(r, "DVI").tag, "Possible stenosis");
  assert.equal(get(r, "Acceleration time").tag, "Possible stenosis");
  near(get(r, "EOA").value, 1.01);
  near(get(r, "EOAi").value, 0.53);
  assert.equal(get(r, "EOAi").tag, "Severe mismatch");
  const ok = run("prosthetic-av", { vmax: 2.4, avti: 40, lvti: 20, at: 70 });
  assert.equal(get(ok, "DVI").level, 0);
  assert.equal(get(ok, "Peak velocity").level, 0);
  assert.equal(get(run("prosthetic-av", { avti: 100, lvti: 20 }), "DVI").tag, "Suggests stenosis");
});

test("Regurgitant volume and fraction", () => {
  const r = run("regurgitant-fraction", { tsv: 128, fsv: 66 });
  assert.equal(get(r, "Regurgitant volume").value, 62);
  near(get(r, "Regurgitant fraction").value, 48.4, 0.1);
  assert.equal(get(r, "Regurgitant fraction").tag, "Moderate–severe");
  assert.equal(get(r, "Regurgitant volume").level, 3);
  assert.deepEqual(run("regurgitant-fraction", { tsv: 60, fsv: 70 }), []);
});

test("TAPSE/PASP", () => {
  const r = run("tapse-pasp", { tapse: 16, trv: 3.5, rap: 8 });
  near(get(r, "PASP").value, 57);
  near(get(r, "TAPSE/PASP").value, 0.28);
  assert.equal(get(r, "TAPSE/PASP").level, 3);
  assert.equal(get(run("tapse-pasp", { tapse: 22, pasp: 30 }), "TAPSE/PASP").level, 0);
  assert.equal(get(run("tapse-pasp", { tapse: 18, pasp: 45 }), "TAPSE/PASP").level, 2);
});

test("IVC and RA pressure", () => {
  assert.equal(get(run("ivc-rap", { dmax: 1.8, dmin: 0.6 }), "Estimated RAP").value, 3);
  assert.equal(get(run("ivc-rap", { dmax: 1.8, dmin: 1.4 }), "Estimated RAP").value, 8);
  assert.equal(get(run("ivc-rap", { dmax: 2.5, dmin: 1.0 }), "Estimated RAP").value, 8);
  assert.equal(get(run("ivc-rap", { dmax: 2.4, dmin: 1.9 }), "Estimated RAP").value, 15);
});

test("Fluid responsiveness (ΔVTI)", () => {
  const r = run("fluid-responsiveness", { v0: 15, v1: 18, ld: 2, hr: 100 });
  near(get(r, "ΔVTI").value, 20);
  assert.equal(get(r, "ΔVTI").tag, "Fluid responsive");
  near(get(r, "Stroke volume (baseline)").value, 47.1, 0.1);
  near(get(r, "Cardiac output (baseline)").value, 4.71, 0.01);
  assert.equal(get(run("fluid-responsiveness", { v0: 20, v1: 21 }), "ΔVTI").tag, "Not fluid responsive");
});
