import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  test: {
    // Use jsdom for React component tests
    environment: 'jsdom',

    // Run setup file before each test suite
    setupFiles: ['./src/test/setup.ts'],

    // Include test files matching these patterns
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],

    // Global test utilities (describe, it, expect, etc.) without imports
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/test/**',
        'src/types/**',
      ],
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
