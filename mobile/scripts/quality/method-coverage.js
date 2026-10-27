// Lab 2. Statement / branch coverage limited to each lab method's lines.
// Usage from mobile/:  node scripts/quality/method-coverage.js human
const fs = require('fs');
const path = require('path');

const set = process.argv[2] || 'human';
// Decision coverage = every outcome of every decision taken at least once.
// Istanbul does not report loops as branches, and for `a ?? b` it counts operand evaluations
// (branch 0 = left evaluated, branch 1 = right evaluated), so outcomes are derived from its counters:
//   `??`  nullish     -> right operand evaluated (b[1] > 0)
//         not nullish -> left evaluated more often than right (b[0] - b[1] > 0)
//   loop  body runs   -> first statement of the body executed;  loop exits -> loop statement reached
function branchesOn(fc, inside, type, line) {
  return Object.entries(fc.branchMap)
    .filter(([, br]) => inside(br.loc) && br.type === type && br.loc.start.line === line)
    .map(([id, br]) => ({ id, br, counts: fc.b[id] }));
}
function statementCount(fc, line) {
  const onLine = Object.entries(fc.statementMap)
    .filter(([, loc]) => loc.start.line === line)
    .sort((a, b) => a[1].start.column - b[1].start.column);
  return onLine.length ? fc.s[onLine[0][0]] : 0;
}
function nullish(fc, inside, line, what) {
  const [{ counts }] = branchesOn(fc, inside, 'binary-expr', line);
  return [
    { line, outcome: `?? ${what}: recommendation is null -> default text`, covered: counts[1] > 0, evidence: `right evaluated ${counts[1]}x` },
    { line, outcome: `?? ${what}: recommendation present -> recommendation`, covered: counts[0] - counts[1] > 0, evidence: `left-only ${counts[0] - counts[1]}x` },
  ];
}
function loop(fc, line, bodyLine, what) {
  return [
    { line, outcome: `${what} loop: body runs`, covered: statementCount(fc, bodyLine) > 0, evidence: `body stmt line ${bodyLine} ran ${statementCount(fc, bodyLine)}x` },
    { line, outcome: `${what} loop: exits`, covered: statementCount(fc, line) > 0, evidence: `loop reached ${statementCount(fc, line)}x` },
  ];
}
function twoWay(fc, inside, type, line, labels) {
  const [{ counts }] = branchesOn(fc, inside, type, line);
  return labels.map((outcome, i) => ({ line, outcome, covered: counts[i] > 0, evidence: `${counts[i]}x` }));
}

const METHODS = [
  {
    name: 'analysisNotice', file: 'src/components/detections.ts', from: 131, to: 146,
    decisions: (fc, inside) => [
      ...branchesOn(fc, inside, 'switch', 133).flatMap(({ counts }) =>
        ['no_damage', 'poor_quality', 'low_confidence', 'default'].map((c, i) => ({
          line: 133, outcome: `switch -> ${c}`, covered: counts[i] > 0, evidence: `${counts[i]}x`,
        }))),
      ...nullish(fc, inside, 135, 'no_damage'),
      ...nullish(fc, inside, 137, 'poor_quality'),
      ...nullish(fc, inside, 141, 'low_confidence'),
    ],
  },
  {
    name: 'sessionPrimaryDamage', file: 'src/components/SessionDetailView.tsx', from: 36, to: 45,
    decisions: (fc, inside) => [
      ...loop(fc, 39, 40, 'outer (photos)'),
      ...loop(fc, 40, 41, 'inner (detections)'),
      ...twoWay(fc, inside, 'if', 41, ['if confidence > topConf: true', 'if confidence > topConf: false']),
      ...twoWay(fc, inside, 'cond-expr', 44, ['topLabel ? : truthy -> prettified label', 'topLabel ? : falsy -> null']),
    ],
  },
];

const mobile = path.resolve(__dirname, '..', '..');
const coverage = JSON.parse(fs.readFileSync(path.join(mobile, 'coverage', set, 'coverage-final.json'), 'utf8'));
const pct = (hit, all) => (all === 0 ? '—' : `${((100 * hit) / all).toFixed(1)} %`);

console.log(`Test suite: ${set}\n`);
for (const m of METHODS) {
  const key = Object.keys(coverage).find((k) => path.normalize(k).endsWith(path.normalize(m.file)));
  const fc = coverage[key];
  const inside = (loc) => loc.start.line >= m.from && loc.start.line <= m.to;

  const statements = Object.entries(fc.statementMap).filter(([, loc]) => inside(loc));
  const stHit = statements.filter(([id]) => fc.s[id] > 0).length;

  const branches = Object.entries(fc.branchMap).filter(([, br]) => inside(br.loc));
  let brAll = 0;
  let brHit = 0;
  const rows = [];
  for (const [id, br] of branches) {
    fc.b[id].forEach((count, i) => {
      brAll += 1;
      if (count > 0) brHit += 1;
      // An implicit `else` has no location of its own; report it on the `if` line.
      const own = br.locations[i];
      const line = own && own.start && own.start.line ? own.start.line : br.loc.start.line;
      const label = own && own.start && own.start.line ? `branch ${i}` : `branch ${i} (implicit else)`;
      rows.push(`    line ${String(line).padStart(3)}  ${br.type.padEnd(11)} ${label}  hits ${count}`);
    });
  }

  const decisions = m.decisions(fc, inside);
  const dHit = decisions.filter((d) => d.covered).length;

  console.log(`${m.name} (${m.file}:${m.from}-${m.to})`);
  console.log(`  statements ${stHit}/${statements.length}  ${pct(stHit, statements.length)}`);
  console.log(`  branches   ${brHit}/${brAll}  ${pct(brHit, brAll)}   (Istanbul)`);
  console.log(`  decisions  ${dHit}/${decisions.length}  ${pct(dHit, decisions.length)}   (outcomes below)`);
  console.log('  Istanbul branches:');
  console.log(rows.join('\n'));
  console.log('  Decision outcomes:');
  for (const d of decisions) console.log(`    line ${String(d.line).padStart(3)}  ${d.covered ? 'covered    ' : 'NOT covered'}  ${d.outcome}  (${d.evidence})`);
  console.log();
}
