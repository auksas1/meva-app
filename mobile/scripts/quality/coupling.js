// Lab 2. 6b: module coupling from a madge --json dependency graph.
// Usage from mobile/:
//   npx --yes madge@8.0.0 --extensions ts,tsx --ts-config tsconfig.json --json src > reports/madge.json
//   node scripts/quality/coupling.js reports/madge.json
//   Ce (efferent) = how many project modules this module imports
//   Ca (afferent) = how many project modules import this module
//   I  (instability) = Ce / (Ca + Ce): 0 = stable (many depend on it), 1 = unstable (depends on many)
const fs = require('fs');

// PowerShell redirection may write UTF-16 or UTF-8 with a BOM; accept both.
const raw = fs.readFileSync(process.argv[2]);
const text = raw[0] === 0xff && raw[1] === 0xfe ? raw.toString('utf16le') : raw.toString('utf8');
const graph = JSON.parse(text.replace(/^\uFEFF/, ''));
const ca = {};
for (const [mod, deps] of Object.entries(graph)) {
  ca[mod] = ca[mod] || 0;
  for (const d of deps) ca[d] = (ca[d] || 0) + 1;
}
const rows = Object.keys(graph).map((mod) => {
  const ce = graph[mod].length;
  const a = ca[mod] || 0;
  return { mod, ca: a, ce, i: a + ce === 0 ? 0 : ce / (a + ce) };
});
rows.sort((x, y) => y.ca + y.ce - (x.ca + x.ce));

console.log('| Modulis | Ca (ji naudoja) | Ce (jis naudoja) | I = Ce/(Ca+Ce) |');
console.log('|---|---|---|---|');
for (const r of rows) console.log(`| ${r.mod} | ${r.ca} | ${r.ce} | ${r.i.toFixed(2)} |`);

const n = rows.length;
const edges = rows.reduce((s, r) => s + r.ce, 0);
console.log(`\nModuliu: ${n}. Priklausomybiu (krastiniu): ${edges}. Vid. Ce: ${(edges / n).toFixed(2)}.`);

// Summary per top-level folder (screens, components, services, ...).
const groups = {};
for (const r of rows) {
  const g = r.mod.includes('/') ? r.mod.split('/')[0] : '(src saknis)';
  (groups[g] = groups[g] || []).push(r);
}
console.log('\n| Aplankas | Moduliu | Vid. Ca | Vid. Ce | Vid. I |');
console.log('|---|---|---|---|---|');
for (const [g, rs] of Object.entries(groups).sort()) {
  const avg = (k) => (rs.reduce((s, r) => s + r[k], 0) / rs.length).toFixed(1);
  console.log(`| ${g} | ${rs.length} | ${avg('ca')} | ${avg('ce')} | ${(rs.reduce((s, r) => s + r.i, 0) / rs.length).toFixed(2)} |`);
}

const highCe = rows.filter((r) => r.ce >= 10).sort((x, y) => y.ce - x.ce);
console.log(`\nModuliai su Ce >= 10 (${highCe.length}): ${highCe.map((r) => `${r.mod} (${r.ce})`).join(', ')}`);
