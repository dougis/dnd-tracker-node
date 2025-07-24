import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['config.test.js', 'github-actions-coverage.test.js'],
  },
});