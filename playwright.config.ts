import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load .env.local so E2E fixtures can access Supabase credentials securely
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

export const E2E_STUDENT_EMAIL = process.env.E2E_STUDENT_EMAIL || "e2e-student@nova-test.internal";
export const E2E_STUDENT_PASSWORD = process.env.E2E_STUDENT_PASSWORD || "";

/**
 * NOVA Playwright E2E Configuration
 *
 * Test identity strategy:
 *   - Fixed E2E student account (e2e-student@nova-test.internal) in live Supabase
 *   - Credentials stored in .env.local (gitignored), NEVER in test source
 *   - All test data tagged [E2E] and cleaned up after test run
 *   - Session stored in tests/e2e/.auth/student.json (gitignored) for reuse
 *
 * Acceptance (application → enrollment) is fixture-driven via Supabase Admin API
 * — classified as FIXTURE_DRIVEN (not reviewer-browser E2E) in the report.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./tests/e2e/.results",
  /* Maximum time one test can run */
  timeout: 60_000,
  /* Maximum time to wait for an assertion */
  expect: {
    timeout: 15_000,
  },
  /* Fail the build on CI if you accidentally left test.only in the source */
  forbidOnly: !!process.env.CI,
  /* Retry once on CI to handle flakiness */
  retries: process.env.CI ? 1 : 0,
  /* Sequential by default to avoid auth state conflicts */
  workers: 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    /* Base URL is the local dev server */
    baseURL: "http://localhost:3000",
    /* Collect traces on failure */
    trace: "on-first-retry",
    /* Screenshot on failure */
    screenshot: "only-on-failure",
    /* Do NOT capture video by default (saves disk space) */
    video: "off",
  },

  projects: [
    /* ── Setup project: creates shared auth session ─────────────────────── */
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },

    /* ── Chrome (desktop) ────────────────────────────────────────────────── */
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/student.json",
      },
      dependencies: ["setup"],
    },
  ],

  /* Start Next.js dev server before running tests */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
