// Lab 2. Per-test status table (8.1b) from a Jest --json report.
// Usage from mobile/:  node scripts/quality/test-results.js llm
const fs = require('fs');
const path = require('path');

const set = process.argv[2] || 'human';
const report = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'reports', 'jest', `${set}.json`), 'utf8'));

function classify(message) {
  if (!message) return '';
  const m = message.replace(/\u001b\[[0-9;]*m/g, '');
  if (/Cannot find module/.test(m)) return 'modulis nerastas (importas)';
  if (/TypeError|ReferenceError/.test(m)) return m.match(/(TypeError|ReferenceError)[^\n]*/)[0];
  if (/toBeNull|toEqual|toBe\(|toThrow|toHaveBeenCalled|toHaveBeenNthCalledWith/.test(m)) {
    const expected = (m.match(/Expected[^\n]*\n?[^\n]*/) || [''])[0].replace(/\s+/g, ' ').trim();
    const received = (m.match(/Received[^\n]*/) || [''])[0].replace(/\s+/g, ' ').trim();
    return `assert nesutampa: ${expected} | ${received}`.slice(0, 160);
  }
  return m.split('\n')[0].slice(0, 160);
}

console.log(`Test suite: ${set}`);
for (const file of report.testResults) {
  const name = path.basename(file.name);
  console.log(`\n## ${name}  (${file.status}${file.message && !file.assertionResults.length ? ': ' + classify(file.message) : ''})`);
  console.log('| # | Testas | Rezultatas | Klaida |');
  console.log('|---|---|---|---|');
  file.assertionResults.forEach((t, i) => {
    const title = [...t.ancestorTitles.slice(1), t.title].join(' › ');
    console.log(`| ${i + 1} | ${title.replace(/\|/g, '\\|')} | ${t.status} | ${classify(t.failureMessages[0]).replace(/\|/g, '\\|')} |`);
  });
  const passed = file.assertionResults.filter((t) => t.status === 'passed').length;
  console.log(`\nIš viso: ${file.assertionResults.length}, praėjo ${passed}, nepraėjo ${file.assertionResults.length - passed}`);
}
