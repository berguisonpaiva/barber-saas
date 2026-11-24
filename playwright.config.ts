import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL, trace: "on-first-retry" },
  projects: [{ name: "mobile", use: { ...devices["iPhone 14"] } }],
  webServer: {
    command: `npx next dev --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { NEXT_PUBLIC_APP_URL: baseURL, AUTH_URL: baseURL },
  },
});
