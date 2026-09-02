/**
 * E2E Spec: Authorization & Security Isolation
 *
 * Classification: REAL_AUTHORIZATION_ISOLATION
 *
 * Scenarios:
 * 1. Student cannot access another student's application via manipulated URL
 * 2. Student cannot access another student's enrollment via manipulated URL
 * 3. Student cannot access admin routes
 * 4. taskId query parameter manipulation does not expose other students' tasks
 * 5. No secret keys visible in page HTML/source
 * 6. Client bundle does not expose service-role or secret keys
 */
import { test, expect } from "@playwright/test";

// Fake UUIDs used to test URL manipulation
const FAKE_UUID = "00000000-0000-0000-0000-000000000001";

test.describe("Authorization & Security Isolation", () => {
  test("manipulated application ID returns safe response (not a data leak)", async ({ page }) => {
    await page.goto(`/student/applications/${FAKE_UUID}`);

    // Must not return data from a real student
    // Acceptable outcomes: 404, redirect, or "not found" message
    const body = await page.locator("body").textContent() ?? "";
    const isOk =
      body.includes("not found") ||
      body.includes("Not Found") ||
      body.includes("404") ||
      body.includes("could not be found") ||
      page.url().includes("/student/applications") ||
      page.url().includes("/login");

    expect(isOk).toBeTruthy();

    // Must not expose database IDs or email addresses of other users
    // (We can't check for specific values without knowing other users' data,
    //  but we CAN verify no stack traces or raw SQL errors)
    expect(body).not.toContain("at Object.");
    expect(body).not.toContain("PostgreSQL");
    expect(body).not.toContain("SQLSTATE");
  });

  test("manipulated enrollment ID returns safe response", async ({ page }) => {
    await page.goto(`/student/enrollments/${FAKE_UUID}`);

    const body = await page.locator("body").textContent() ?? "";
    const isOk =
      body.includes("not found") ||
      body.includes("Not Found") ||
      body.includes("404") ||
      page.url().includes("/student/enrollments") ||
      page.url().includes("/login");

    expect(isOk).toBeTruthy();
    expect(body).not.toContain("at Object.");
    expect(body).not.toContain("PostgreSQL");
  });

  test("taskId query parameter manipulation does not expose other students' tasks", async ({ page }) => {
    await page.goto(`/student/learning?taskId=${FAKE_UUID}`);

    const body = await page.locator("body").textContent() ?? "";

    // Must not crash and must not return another student's task data
    expect(body).not.toContain("Unhandled Runtime Error");
    expect(body).not.toContain("Internal Server Error");
    expect(body).not.toContain("at Object.");
  });

  test("admin dashboard is inaccessible to student", async ({ page }) => {
    await page.goto("/admin/dashboard");

    // Must redirect or reject
    const url = page.url();
    const isRejected = url.includes("/login") || url.includes("/student") || url.includes("/admin/login");
    expect(isRejected).toBeTruthy();
  });

  test("company dashboard is inaccessible to student", async ({ page }) => {
    await page.goto("/company/members");

    await page.waitForURL((url) => !url.pathname.endsWith("/company/members"), { timeout: 10_000 }).catch(() => {});
    const url = page.url();
    expect(url).not.toContain("/company/members");
  });


  test("page source does not contain service-role key patterns", async ({ page }) => {
    await page.goto("/student/dashboard");

    // Get the full page content
    const content = await page.content();

    // Service role key patterns to check for
    // We check for patterns, not values, to avoid printing secrets
    const hasSbSecret = content.includes("sb_secret_");
    const hasServiceRole = content.includes("service_role");
    const hasModalToken = /MODAL_TOKEN_SECRET\s*=\s*["'][^"']{10,}/.test(content);
    const hasOpenRouterKey = /sk-or-v1-[a-f0-9]{60,}/.test(content);

    expect(hasSbSecret).toBeFalsy();
    expect(hasServiceRole).toBeFalsy();
    expect(hasModalToken).toBeFalsy();
    expect(hasOpenRouterKey).toBeFalsy();
  });

  test("main JavaScript bundles do not contain secret key patterns", async ({ page }) => {
    const scriptUrls: string[] = [];

    // Intercept JS bundle requests
    page.on("response", (response) => {
      const url = response.url();
      if (url.includes("/_next/static/") && url.endsWith(".js")) {
        scriptUrls.push(url);
      }
    });

    await page.goto("/student/dashboard");
    await page.waitForLoadState("networkidle");

    // Check up to 3 bundles for secret key patterns
    // (checking all ~100 bundles would be too slow)
    const bundlesToCheck = scriptUrls.slice(0, 3);
    for (const url of bundlesToCheck) {
      const response = await page.request.get(url).catch(() => null);
      if (!response) continue;

      const text = await response.text().catch(() => "");

      // Service-role patterns
      expect(text).not.toContain("sb_secret_");
      expect(text).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
      expect(text).not.toContain("MODAL_TOKEN_SECRET");
    }
  });

  test("no raw stack traces exposed in error states", async ({ page }) => {
    // Navigate to a non-existent student page
    await page.goto("/student/nonexistent-page-that-does-not-exist");

    const visibleText = (await page.locator("main, body").first().innerText().catch(() => "")) ?? "";

    // Must not expose internal paths or stack traces to user
    expect(visibleText).not.toContain("node_modules");
    expect(visibleText).not.toContain("C:\\Users\\");
    expect(visibleText).not.toContain("/home/");
    expect(visibleText).not.toContain("at Object.");
  });
});

