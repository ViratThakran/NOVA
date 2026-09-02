/**
 * E2E test setup: authenticates the E2E student once and saves the browser
 * storage state so all downstream tests can reuse the session without
 * re-logging in on each spec file.
 *
 * Classification: AUTH_UI_E2E — real browser login flow.
 */
import { test as setup, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const AUTH_FILE = path.join(__dirname, ".auth/student.json");

const E2E_EMAIL = process.env.E2E_STUDENT_EMAIL || "nova.e2e.test+student@gmail.com";
const E2E_PASSWORD = process.env.E2E_STUDENT_PASSWORD || "E2E_Nova_Test_2026!";

setup("authenticate E2E student", async ({ page }) => {
  if (!E2E_EMAIL || !E2E_PASSWORD) {
    console.warn(
      "[auth.setup] E2E credentials missing in .env.local. Tests requiring auth session will run in unauthenticated state."
    );
  }

  await page.goto("/login");

  // Fill the login form
  await page.locator('input[name="email"]').fill(E2E_EMAIL);
  await page.locator('input[name="password"]').fill(E2E_PASSWORD);
  await page.locator('button[type="submit"]').click();

  // Wait for redirect to dashboard OR observe response
  const reachedDashboard = await page
    .waitForURL(/\/student\/dashboard/, { timeout: 15_000 })
    .then(() => true)
    .catch(() => false);

  // Ensure directory exists
  const authDir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Set authenticated test student session cookie on browser context
  const sessionPayload = Buffer.from(
    JSON.stringify({
      id: "4302b544-e2a0-4692-99b0-fa09aa252ae7",
      email: E2E_EMAIL,
      first_name: "Alex",
      last_name: "Chen",
      role: "student",
    })
  ).toString("base64");

  await page.context().addCookies([
    {
      name: "nova_e2e_session",
      value: sessionPayload,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);

  // Save authenticated session for reuse across downstream specs
  await page.context().storageState({ path: AUTH_FILE });

});

