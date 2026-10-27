// Reports the cyclomatic and cognitive complexity of every function (thresholds set to 0).
// Run: npx eslint -c eslint.metrics.config.mjs src/components/detections.ts src/components/SessionDetailView.tsx
import tseslint from 'typescript-eslint';
import sonarjs from 'eslint-plugin-sonarjs';

export default [
  {
    files: ['**/detections.ts', '**/SessionDetailView.tsx', '**/refactor/*.ts'],
    languageOptions: { parser: tseslint.parser },
    plugins: { sonarjs },
    rules: {
      complexity: ['warn', { max: 0, variant: 'classic' }],
      'sonarjs/cognitive-complexity': ['warn', 0],
    },
  },
];
