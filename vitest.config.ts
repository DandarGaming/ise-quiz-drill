import { getViteConfig } from 'astro/config';
import { defineConfig } from 'vitest/config';

export default defineConfig((env) =>
  getViteConfig({
    test: {
      globals: true,
      environment: 'node',
      setupFiles: ['./vitest.setup.ts'],
      include: [
        'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
        'tests/**/*.{test,spec}.{js,ts}',
      ],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
      },
    },
  })(env),
);
