// Jest unit tests for the lab 2 methods (tests/).
// TEST_SET=human -> own tests only, TEST_SET=llm -> LLM generated tests (*_llm.test.ts); unset -> all.
// TEST_SKIP_NAME=<text> leaves out one test by name (Stryker needs an all-green initial run).
const set = process.env.TEST_SET;

module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/tests'],
  testMatch: [set === 'llm' ? '**/*_llm.test.ts' : '**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', ...(set === 'human' ? ['_llm\\.test\\.ts$'] : [])],
  ...(process.env.TEST_SKIP_NAME ? { testNamePattern: `^(?!.*${process.env.TEST_SKIP_NAME}).*$` } : {}),
  setupFiles: ['<rootDir>/jest.setup.js'],
  // expo-asset is nested under expo/ in package-lock; Metro finds it, Jest's resolver does not.
  moduleNameMapper: { '^expo-asset$': '<rootDir>/node_modules/expo/node_modules/expo-asset' },
  collectCoverageFrom: ['src/components/detections.ts', 'src/components/SessionDetailView.tsx'],
  coverageDirectory: `<rootDir>/coverage/${set || 'all'}`,
  coverageReporters: ['json', 'lcov', 'text', 'html'],
};
