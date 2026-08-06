import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PRODUCTION_BASE_URL;
const sitesBypassBearer = process.env.SITES_BYPASS_BEARER;

if (!baseURL) {
  throw new Error("PRODUCTION_BASE_URL is required for production browser evidence.");
}
if (new URL(baseURL).hostname.endsWith(".chatgpt.site") && !sitesBypassBearer) {
  throw new Error("SITES_BYPASS_BEARER is required for private Sites browser evidence.");
}

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results/production-artifacts",
  fullyParallel: false,
  workers: 1,
  timeout: 240_000,
  expect: { timeout: 15_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "test-results/production-report", open: "never" }],
  ],
  use: {
    baseURL,
    permissions: ["microphone"],
    launchOptions: {
      args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
    },
    screenshot: "only-on-failure",
    // Private Sites authorization is injected at runtime. Never persist it in a trace.
    trace: "off",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
  ],
});
