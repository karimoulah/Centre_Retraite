import { defineConfig, devices } from '@playwright/test';

const port = 5173;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    locale: 'fr-CA',
    timezoneId: 'America/Toronto',
    trace: 'retain-on-failure',
    // Set PW_CHANNEL=chrome to use an installed Chrome instead of the bundled Chromium.
    ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}),
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    // In CI the app is built first; locally an already running dev server is reused.
    command: process.env.CI ? 'npm run start' : 'npm run dev',
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { API_MODE: 'mock' },
  },
});
