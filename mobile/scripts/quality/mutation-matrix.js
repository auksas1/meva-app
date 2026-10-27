// Lab 2. Per-method mutation summary and kill matrix (8.2b) from a Stryker JSON report.
// Usage from mobile/:  node scripts/quality/mutation-matrix.js llm
const fs = require('fs');
const path = require('path');

const set = process.argv[2] || 'human';
const report = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'reports', 'mutation', set, 'report.json'), 'utf8'),
);
const METHOD = { 'detections.ts': 'analysisNotice', 'SessionDetailView.tsx': 'sessionPrimaryDamage' };

const testName = {};
for (const tf of Object.values(report.testFiles || {})) for (const t of tf.tests) testName[t.id] = t.name;

console.log(`Test suite: ${set}`);
for (const [file, data] of Object.entries(report.files)) {
  const method = METHOD[path.basename(file)];
  const mutants = data.mutants;
  const by = (s) => mutants.filter((m) => m.status === s).length;
  const killed = by('Killed');
  const timeout = by('Timeout');
  const valid = mutants.filter((m) => !['CompileError', 'RuntimeError', 'Ignored'].includes(m.status)).length;
  const covered = mutants.filter((m) => m.status !== 'NoCoverage' && m.status !== 'Ignored').length;
  const pct = (a, b) => (b ? `${((100 * a) / b).toFixed(1)} %` : '—');

  console.log(`\n## ${method} (${path.basename(file)})`);
  console.log(`mutants ${mutants.length}: killed ${killed}, timeout ${timeout}, survived ${by('Survived')}, no coverage ${by('NoCoverage')}, errors ${mutants.length - valid}`);
  console.log(`mutation score = (killed + timeout) / valid = ${killed + timeout}/${valid} = ${pct(killed + timeout, valid)}`);
  console.log(`covered score  = (killed + timeout) / covered = ${killed + timeout}/${covered} = ${pct(killed + timeout, covered)}`);

  const perMutator = {};
  for (const m of mutants) perMutator[m.mutatorName] = (perMutator[m.mutatorName] || 0) + 1;
  console.log(`by mutator: ${Object.entries(perMutator).map(([k, v]) => `${k} ${v}`).join(', ')}`);

  console.log('\n| Mutant | Line | Mutator | Replacement | Status | Killed by (tests) |');
  console.log('|---|---|---|---|---|---|');
  for (const m of mutants) {
    const repl = (m.replacement || '').replace(/\s+/g, ' ').replace(/\|/g, '\\|').slice(0, 60);
    console.log(`| ${m.id} | ${m.location.start.line} | ${m.mutatorName} | \`${repl}\` | ${m.status} | ${(m.killedBy || []).length} |`);
  }

  // Tests relevant to this method = tests that cover at least one of its mutants.
  const kills = {};
  for (const m of mutants) {
    for (const t of m.coveredBy || []) kills[t] = kills[t] || new Set();
    for (const t of m.killedBy || []) (kills[t] = kills[t] || new Set()).add(m.id);
  }
  const tests = Object.keys(kills);
  const killable = new Set(mutants.filter((m) => (m.killedBy || []).length).map((m) => m.id));

  // Greedy set cover: smallest subset of tests that still kills every killed mutant.
  const left = new Set(killable);
  const chosen = [];
  while (left.size) {
    let best = null;
    let bestGain = 0;
    for (const t of tests) {
      const gain = [...kills[t]].filter((id) => left.has(id)).length;
      if (gain > bestGain) { best = t; bestGain = gain; }
    }
    if (!best) break;
    chosen.push(best);
    for (const id of kills[best]) left.delete(id);
  }
  const zero = tests.filter((t) => kills[t].size === 0);
  const unique = tests.filter((t) => [...kills[t]].some((id) => mutants.find((m) => m.id === id).killedBy.length === 1));

  console.log(`\ntests covering this method: ${tests.length}`);
  console.log(`minimal subset that kills the same mutants (greedy): ${chosen.length} -> ${chosen.map((t) => testName[t]).join(' ; ')}`);
  console.log(`tests that kill no mutant: ${zero.length}`);
  for (const t of zero) console.log(`  - ${testName[t]}`);
  console.log(`tests that are the only killer of some mutant: ${unique.length}`);
  for (const t of unique) console.log(`  - ${testName[t]}`);
  console.log('\nkills per test:');
  for (const t of tests.sort((a, b) => kills[b].size - kills[a].size)) console.log(`  ${String(kills[t].size).padStart(2)}  ${testName[t]}`);
}
