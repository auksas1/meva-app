// Mutation testing of the two lab 2 methods only. Run: TEST_SET=human|llm npx stryker run
const set = process.env.TEST_SET || 'all';

export default {
  packageManager: 'npm',
  testRunner: 'jest',
  jest: { configFile: 'jest.config.js', enableFindRelatedTests: false },
  coverageAnalysis: 'perTest',
  // Run every covering test for every mutant, so the report records all killers.
  disableBail: true,
  mutate: [
    'src/components/detections.ts:131-146', // analysisNotice
    'src/components/SessionDetailView.tsx:36-45', // sessionPrimaryDamage
  ],
  reporters: ['clear-text', 'html', 'json', 'progress'],
  htmlReporter: { fileName: `reports/mutation/${set}/index.html` },
  jsonReporter: { fileName: `reports/mutation/${set}/report.json` },
  tempDirName: '.stryker-tmp',
  ignorePatterns: ['coverage', 'reports', 'refactor', 'dist', '.expo', 'android', 'ios'],
  thresholds: { high: 80, low: 60, break: null },
};
