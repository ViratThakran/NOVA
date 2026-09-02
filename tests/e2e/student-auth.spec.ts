/**
 * E2E Spec: Student Authentication
 *
 * Classification: AUTH_UI_E2E — real browser login flow.
 *
 * Scenarios:
 * 1. Login page is reachable and renders correctly
 * 2. Authenticated student can navigate to dashboard
 * 3. Student session persists across navigation
 * 4. Unauthenticated access to /student/* redirects to /login
 * 5. Student cannot access /admin routes
 */
import { test, expect } from "@playwright/test";

// These tests use the authenticated session created by auth.setup.ts
test.describe("Student Authentication", () => {
  test("dashboard loads for authenticated student", async ({ page }) => {
    await page.goto("/student/dashboard");
    await expect(page).toHaveURL(/\/student\/dashboard/);

    // Page must have a heading (not a redirect loop or error page)
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();

    // No auth error shown
    await expect(page.getByText("session has expired", { exact: false })).not.toBeVisible();
  });

  test("session persists across navigation", async ({ page }) => {
    await page.goto("/student/dashboard");
    await expect(page).toHaveURL(/\/student\/dashboard/);

    // Navigate to applications
    await page.goto("/student/applications");
    await expect(page).toHaveURL(/\/student\/applications/);

    // Navigate back — still authenticated
    await page.goto("/student/dashboard");
    await expect(page).toHaveURL(/\/student\/dashboard/);

    // No redirect to /login occurred
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("student cannot access admin routes", async ({ page }) => {
    await page.goto("/admin/dashboard");

    // Should redirect away from admin (either to login or student dashboard)
    await expect(page).not.toHaveURL(/\/admin\/dashboard/);
  });

  test("student cannot access company routes", async ({ page }) => {
    await page.goto("/company/members");

    // Company members page requires company membership, redirects away
    await page.waitForURL((url) => !url.pathname.endsWith("/company/members"), { timeout: 10_000 }).catch(() => {});
    const url = page.url();
    expect(url).not.toContain("/company/members");
  });



  test("page title is set correctly", async ({ page }) => {
    await page.goto("/student/dashboard");
    const title = await page.title();
    expect(title).toContain("NOVA");
  });
});

// Unauthenticated tests — these use a fresh browser context WITHOUT the stored session
test.describe("Unauthenticated Access Rejection", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("login page is accessible without authentication", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);

    // Login form is rendered
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("unauthenticated access to student dashboard redirects to login", async ({ page }) => {
    await page.goto("/student/dashboard");

    // Must redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated access to learning workspace redirects to login", async ({ page }) => {
    await page.goto("/student/learning");
    await expect(page).toHaveURL(/\/login/);
  });

  test("invalid login credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[name="email"]').fill("nonexistent@example.com");
    await page.locator('input[name="password"]').fill("wrongpassword123");
    await page.locator('button[type="submit"]').click();

    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);

    // Error message shown
    const errorEl = page.locator('[role="alert"]');
    await expect(errorEl).toBeVisible({ timeout: 10_000 });
  });
});
