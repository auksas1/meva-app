// Lab 2. 6a: Maintainability Index per TypeScript file with typhonjs-escomplex.
// Usage from mobile/:  node scripts/quality/maintainability.js
// escomplex formula (escomplex-plugin-metrics-module/src/ModuleMetricPostAverage.js):
//   MI = 171 - 3.42*ln(avg Halstead effort) - ln(avg cyclomatic) - 16.2*ln(avg logical SLOC)
//   newmi: MI * 100 / 171 (0-100, Visual Studio scale)
const fs = require('fs');
const path = require('path');
const escomplex = require('typhonjs-escomplex');

const root = path.resolve(__dirname, '..', '..');
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.tsx?$/.test(e.name) && !e.name.endsWith('.d.ts')) files.push(p);
  }
})(path.join(root, 'src'));

const rows = [];
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const raw = escomplex.analyzeModule(src, { newmi: false });
  const vs = escomplex.analyzeModule(src, { newmi: true });
  rows.push({
    file: path.relative(root, f).split(path.sep).join('/'),
    mi171: raw.maintainability,
    mi100: vs.maintainability,
    functions: raw.methods.length,
    avgCC: raw.methodAverage.cyclomatic,
    avgEffort: raw.methodAverage.halstead.effort,
    avgSloc: raw.methodAverage.sloc.logical,
  });
}
rows.sort((a, b) => a.mi100 - b.mi100);

const band = (mi) => (mi >= 20 ? 'gerai (≥20)' : mi >= 10 ? 'vidutiniškai (10–19)' : 'blogai (<10)');
console.log('| Failas | MI (0–171) | MI (0–100, VS) | Vertinimas | Funkcijų | Vid. CC | Vid. Halstead pastangos | Vid. loginės eil. |');
console.log('|---|---|---|---|---|---|---|---|');
for (const r of rows) {
  console.log(`| ${r.file} | ${r.mi171.toFixed(1)} | ${r.mi100.toFixed(1)} | ${band(r.mi100)} | ${r.functions} | ${r.avgCC.toFixed(2)} | ${r.avgEffort.toFixed(0)} | ${r.avgSloc.toFixed(1)} |`);
}
const avg = (k) => rows.reduce((s, r) => s + r[k], 0) / rows.length;
console.log(`\nFailų: ${rows.length}. Vidutinis MI: ${avg('mi171').toFixed(1)} (0–171) / ${avg('mi100').toFixed(1)} (0–100).`);
console.log(`Žemiau 20 (0–100 skalėje): ${rows.filter((r) => r.mi100 < 20).length} failai.`);
