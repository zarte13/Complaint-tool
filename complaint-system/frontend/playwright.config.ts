import { defineConfig, devices } from '@playwright/test';

// Use Node-style globals without type errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const env: any = (globalThis as any).process?.env ?? {};
const frontendUrl: string = env.BASE_URL_FRONTEND || 'http://localhost:3000';
const isCI = !!env.CI;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: 'line',
  use: {
    baseURL: frontendUrl,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Keep one browser in CI to shorten time; add back if needed
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: frontendUrl,
    timeout: 120_000,
    // Avoid failing when runner/environment already launched the dev server
    reuseExistingServer: true,
  },
});