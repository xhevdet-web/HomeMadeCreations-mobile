import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: { timeout: 10000 },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    ...devices['iPhone 13'],
    defaultBrowserType: 'chromium',
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node scripts/serve-web.cjs',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
  reporter: 'list',
});
