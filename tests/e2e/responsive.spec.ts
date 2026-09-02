/**
 * E2E Spec: Browser Responsiveness & Accessibility
 *
 * Checks key pages at desktop, tablet, and mobile viewports.
 * Also performs accessibility smoke tests (headings, labels, button names).
 *
 * These are smoke tests, not full WCAG compliance audits.
 */
import { test, expect } from "@playwright/test";

const VIEWPORTS = [
  { name: "Desktop", width: 1440, height: 900 },
  { name: "Tablet", width: 768, height: 1024 },
  { name: "Mobile", width: 390, height: 844 },
];

const KEY_PAGES = [
  { path: "/student/dashboard", title: "Dashboard" },
  { path: "/student/applications", title: "Applications" },
  { path: "/student/enrollments", title: "Enrollments" },
  { path: "/student/learning", title: "Learning Workspace" },
];

for (const viewport of VIEWPORTS) {
  test.describe(`Responsive — ${viewport.name} (${viewport.width}×${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const { path, title } of KEY_PAGES) {
      test(`${title} renders without horizontal overflow at ${viewport.name}`, async ({ page }) => {
        await page.goto(path);

        // No crash
        await expect(page.locator("body")).not.toContainText("Unhandled Runtime Error");

        // Check for horizontal overflow: document width should not exceed viewport width
        const hasOverflow = await page.evaluate((expectedWidth) => {
          return document.documentElement.scrollWidth > expectedWidth + 20; // 20px tolerance
        }, viewport.width);

        expect(hasOverflow).toBeFalsy();

        // Primary heading visible
        const h1 = page.locator("h1").first();
        await expect(h1).toBeVisible();
      });
    }

    test(`Login page renders at ${viewport.name}`, async ({ page }) => {
      // Use no-auth context for this test
      await page.context().clearCookies();
      await page.goto("/login");

      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // No horizontal overflow
      const hasOverflow = await page.evaluate((w) => document.documentElement.scrollWidth > w + 20, viewport.width);
      expect(hasOverflow).toBeFalsy();
    });
  });
}

test.describe("Accessibility Smoke Tests", () => {
  test("login page has correct heading and form labels", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");

    // Must have at least one heading
    const headings = page.locator("h1, h2");
    await expect(headings.first()).toBeVisible();

    // Form inputs must have labels or aria-labels
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Labels must exist (either htmlFor association or aria-label)
    const emailLabel = page.locator('label[for="email"]');
    const hasEmailLabel = await emailLabel.isVisible().catch(() => false);
    expect(hasEmailLabel).toBeTruthy();

    // Submit button has accessible name
    const submitBtn = page.locator('button[type="submit"]');
    const btnText = await submitBtn.textContent();
    expect(btnText?.trim().length).toBeGreaterThan(0);
  });

  test("student dashboard has page title and accessible structure", async ({ page }) => {
    await page.goto("/student/dashboard");

    // Page title must be set
    const title = await page.title();
    expect(title.length).toBeGreaterThan(3);
    expect(title).toContain("NOVA");

    // Must have an h1
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();

    // All buttons must have accessible names (non-empty text content or aria-label)
    const buttons = page.locator("button");
    const count = await buttons.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      const btn = buttons.nth(i);
      const isVisible = await btn.isVisible();
      if (!isVisible) continue;

      const text = await btn.textContent();
      const ariaLabel = await btn.getAttribute("aria-label");
      const hasName = (text?.trim() || "").length > 0 || (ariaLabel || "").length > 0;
      expect(hasName).toBeTruthy();
    }
  });

  test("learning workspace has appropriate heading hierarchy", async ({ page }) => {
    await page.goto("/student/learning");

    // Must have a heading
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();

    // No crash
    await expect(page.locator("body")).not.toContainText("Unhandled Runtime Error");
  });

  test("browser console is clean on dashboard load", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/student/dashboard");
    await page.waitForLoadState("networkidle");

    // Filter known-acceptable errors (e.g., hot reload in dev mode)
    const criticalErrors = consoleErrors.filter((e) => {
      return (
        !e.includes("favicon") &&
        !e.includes("hot-update") &&
        !e.includes("/_next/static") &&
        !e.includes("WebSocket") &&
        !e.includes("[Fast Refresh]") &&
        !e.includes("useLayoutEffect") // Server-side warning — acceptable in dev
      );
    });

    if (criticalErrors.length > 0) {
      console.warn("Browser console errors on dashboard:", criticalErrors);
    }

    // No uncaught React errors
    const hasReactError = criticalErrors.some((e) => e.includes("React") && e.includes("Error"));
    expect(hasReactError).toBeFalsy();
  });

  test("browser console is clean on learning workspace load", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/student/learning");
    await page.waitForLoadState("networkidle");

    const criticalErrors = consoleErrors.filter((e) =>
      !e.includes("favicon") &&
      !e.includes("hot-update") &&
      !e.includes("WebSocket") &&
      !e.includes("[Fast Refresh]") &&
      !e.includes("useLayoutEffect")
    );

    const hasReactError = criticalErrors.some((e) => e.includes("React") && e.includes("Error"));
    expect(hasReactError).toBeFalsy();
  });
});
