import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  reporter: 'list',
  timeout: 15000,
  expect: { timeout: 3000 },
  use: { baseURL: 'http://localhost:4391' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'tablet', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'mobile', use: { viewport: { width: 320, height: 700 } } },
  ],
  webServer: {
    command: 'node tests/static-server.js 4391',
    url: 'http://localhost:4391',
    reuseExistingServer: false,
    stdout: 'ignore',
  },
});
