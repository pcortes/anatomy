import { defineConfig, devices } from "@playwright/test";

const port = 4399;
const productionBaseUrl = process.env.PRODUCTION_BASE_URL;
const baseURL = productionBaseUrl || `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results/artifacts",
  fullyParallel: false,
  workers: 1,
  timeout: 240_000,
  expect: { timeout: 15_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "test-results/report", open: "never" }],
  ],
  use: {
    baseURL,
    permissions: ["microphone"],
    launchOptions: {
      args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
    },
    screenshot: "only-on-failure",
    // Production authorization and short-lived voice credentials must never be
    // captured in a retained trace.
    trace: productionBaseUrl ? "off" : "retain-on-failure",
    video: "retain-on-failure",
  },
  webServer: productionBaseUrl ? undefined : {
    command: `npm run dev -- --port ${port}`,
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
