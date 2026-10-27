
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/*.llm.test.ts'],
    environment: 'node',
  },
});
