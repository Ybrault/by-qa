import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  reporter: 'list',
  use: { baseURL: 'http://localhost:4391' },
  webServer: {
    command: 'python3 -m http.server 4391',
    url: 'http://localhost:4391',
    reuseExistingServer: false,
    stdout: 'ignore',
  },
});
