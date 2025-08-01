import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.astro'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.astro/',
        'src/test/',
        '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        '**/*.d.ts',
        'astro.config.mjs',
        'vitest.config.ts',
        'eslint.config.js',
        'tailwind.config.mjs',
        'components.json'
      ],
      include: [
        'src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx,astro}',
        'src/lib/**/*.{js,ts}',
        'src/components/**/*.{astro,tsx}',
        'src/middleware.js'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 75,
          lines: 80,
          statements: 80
        },
        'src/lib/': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95
        },
        'src/middleware.js': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
