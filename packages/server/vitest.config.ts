import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'clover'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'prisma/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'src/test/',
      ],
    },
  },
});