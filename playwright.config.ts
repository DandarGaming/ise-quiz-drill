import { defineConfig, devices } from '@playwright/test';

// Runs against the production build: `npm run build` first, then
// `npm run test:e2e`. The server is the same Node entry the container uses.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4399',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node dist/server/entry.mjs',
    url: 'http://127.0.0.1:4399/api/health',
    // Always start the built app, never reuse a dev server on another port
    reuseExistingServer: false,
    env: { HOST: '127.0.0.1', PORT: '4399' },
  },
});
