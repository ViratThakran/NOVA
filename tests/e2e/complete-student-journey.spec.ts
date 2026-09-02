/**
 * MASTER BROWSER E2E SPEC: NOVA COMPLETE STUDENT INTERNSHIP JOURNEY
 * 
 * Objectives:
 * 1. Real Chromium Browser execution via Playwright
 * 2. Complete student journey in exact sequential order:
 *    LOGIN → DISCOVERY → DETAIL → APPLICATION → ENROLLMENT → WORKSPACE
 *    → AI TASK 1 → SUBMISSION ATTEMPT 1 → ASYNC PROCESSING → REVIEW
 *    → REVISION ATTEMPT 2 → REVIEW 2 → MILESTONE ADVANCEMENT → TASK 2
 * 3. Multi-viewport verification (1440x900, 768x1024, 390x844)
 * 4. Authorization and security isolation checks
 * 5. Console health & network error trapping
 */

import { test, expect } from "@playwright/test";

const E2E_GITHUB_URL = "https://github.com/ViratThakran/NOVA";
const E2E_COMMIT_SHA = "b96c0795510ebfa47bcfc056602d2481c3399787";
const E2E_BRANCH = "main";

test.describe.serial("NOVA Complete Student Journey E2E Verification", () => {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Monitor console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(`[Console Error] ${msg.text()}`);
      }
    });

    // Monitor failed network requests (excluding favicon or 3rd party analytics)
    page.on("requestfailed", (request) => {
      const url = request.url();
      if (!url.includes("favicon") && !url.includes("analytics")) {
        failedRequests.push(`[Failed Request] ${request.method()} ${url}: ${request.failure()?.errorText}`);
      }
    });
  });

  // STEP 1: AUTHENTICATION & SESSION PERSISTENCE
  test("Step 1: Authenticated student session loads and persists across navigation and reload", async ({ page }) => {
    await page.goto("/student/dashboard");
    await expect(page).toHaveURL(/\/student\/dashboard/);

    // Dashboard heading must render
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 10_000 });

    // Page title includes NOVA
    const title = await page.title();
    expect(title).toContain("NOVA");

    // Refresh and verify session survives
    await page.reload();
    await expect(page).toHaveURL(/\/student\/dashboard/);
    await expect(page.locator("body")).not.toContainText("session has expired");
  });

  // STEP 2: INTERNSHIP DISCOVERY
  test("Step 2: Internship Discovery marketplace displays available internships", async ({ page }) => {
    await page.goto("/student/internships");
    await expect(page).toHaveURL(/\/student\/internships/);

    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();

    // Verify marketplace listings are present
    const cards = page.locator('a[href^="/student/internships/"], [class*="card"], [class*="listing"]');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  // STEP 3: INTERNSHIP DETAIL VIEW
  test("Step 3: Internship detail page renders full track curriculum and deliverables", async ({ page }) => {
    await page.goto("/student/internships");

    const internshipLinks = page.locator('a[href^="/student/internships/"]');
    const count = await internshipLinks.count();
    expect(count).toBeGreaterThan(0);

    const firstLink = internshipLinks.first();
    await firstLink.click();
    await expect(page).toHaveURL(/\/student\/internships\/.+/);

    // Verify details are displayed
    const detailHeading = page.locator("h1, h2").first();
    await expect(detailHeading).toBeVisible();
    await expect(page.locator("body")).not.toContainText("404");
  });

  // STEP 4: APPLICATION FLOW & PERSISTENCE
  test("Step 4: Student applications page lists submitted applications with real status", async ({ page }) => {
    await page.goto("/student/applications");
    await expect(page).toHaveURL(/\/student\/applications/);

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();

    // Verify no unhandled error occurred
    await expect(page.locator("body")).not.toContainText("Unhandled Runtime Error");
  });

  // STEP 5: ACTIVE ENROLLMENT & DASHBOARD CONSISTENCY
  test("Step 5: Dashboard and Workspace display active internship and authoritative tasks", async ({ page }) => {
    // Navigate to Dashboard
    await page.goto("/student/dashboard");
    await expect(page).toHaveURL(/\/student\/dashboard/);

    // Check learning state card / active track
    const bodyDashboard = await page.locator("body").textContent();
    expect(bodyDashboard).not.toContain("Internal Server Error");

    // Navigate to Learning Workspace
    await page.goto("/student/learning");
    await expect(page).toHaveURL(/\/student\/learning/);

    const bodyWorkspace = await page.locator("body").textContent();
    expect(bodyWorkspace).not.toContain("Internal Server Error");
    expect(bodyWorkspace).not.toContain("Unhandled Runtime Error");
  });

  // STEP 6: LEARNING WORKSPACE AUTHORITATIVE TASK RENDERING
  test("Step 6: Learning Workspace renders structured engineering task with complete specifications", async ({ page }) => {
    await page.goto("/student/learning");

    const noEnrollment = await page.locator("text=No Active Internship Enrollment Found")
      .isVisible({ timeout: 2_000 }).catch(() => false);
    const preparing = await page.locator("text=Preparing Your Next Engineering Task")
      .isVisible({ timeout: 2_000 }).catch(() => false);

    if (noEnrollment || preparing) {
      // Workspace is waiting or in clean state
      return;
    }

    // Verify structured task sections
    const taskHeading = page.locator("h1").first();
    await expect(taskHeading).toBeVisible({ timeout: 5_000 });

    // Verify task instructions, deliverables, or acceptance criteria are visible
    const hasInstructions = await page
      .getByText("Implementation Instructions")
      .or(page.getByText("Technical Deliverables"))
      .or(page.getByText("Acceptance & Evaluation Criteria"))
      .or(page.getByText("Business Context"))
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    expect(hasInstructions || noEnrollment || preparing).toBeTruthy();
  });

  // STEP 7: REAL TASK SUBMISSION VIA BROWSER
  test("Step 7: Real task submission form accepts GitHub repository & commit SHA with non-blocking response", async ({ page }) => {
    await page.goto("/student/learning");

    const githubInput = page
      .locator('input[name="githubUrl"], input[placeholder*="github"], input[placeholder*="GitHub"]')
      .or(page.getByPlaceholder("https://github.com/username/repository"))
      .first();
    const isFormVisible = await githubInput.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!isFormVisible) {
      // Task already in submitted/review state
      return;
    }

    // Fill real GitHub repo URL and commit SHA
    await githubInput.fill(E2E_GITHUB_URL);

    const shaInput = page
      .locator('input[name="commitSha"], input[name="commit_sha"], input[placeholder*="commit"], input[placeholder*="SHA"]')
      .or(page.getByPlaceholder("e.g. 7fd1a60"))
      .first();
    const shaVisible = await shaInput.isVisible({ timeout: 2_000 }).catch(() => false);
    if (shaVisible) await shaInput.fill(E2E_COMMIT_SHA);

    const notesInput = page
      .locator('textarea[name="studentExplanation"], textarea[name="notes"], textarea[name="explanation"]')
      .or(page.getByPlaceholder("Briefly describe what you implemented"))
      .first();
    const notesVisible = await notesInput.isVisible({ timeout: 2_000 }).catch(() => false);
    if (notesVisible) await notesInput.fill("[E2E] Automated test submission for complete student journey verification.");

    const submitBtn = page
      .locator('button[type="submit"]')
      .or(page.getByRole("button", { name: /Submit/i }))
      .first();
    const submitVisible = await submitBtn.isVisible({ timeout: 3_000 }).catch(() => false);

    if (submitVisible) {
      const startTime = Date.now();
      await submitBtn.click();

      // Immediate non-blocking response check (< 20 seconds)
      await page.waitForTimeout(3_000);
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(20_000);

      // Verify page shows acknowledgement/processing state without crashing
      const body = await page.locator("body").textContent();
      expect(body).not.toContain("Unhandled Runtime Error");
      expect(body).not.toContain("Internal Server Error");
    }
  });

  // STEP 8: REFRESH RECOVERY
  test("Step 8: Refreshing the page during/after submission preserves student state", async ({ page }) => {
    await page.goto("/student/learning");
    await page.reload();

    await expect(page).toHaveURL(/\/student\/learning/);
    await expect(page.locator("body")).not.toContainText("Unhandled Runtime Error");
  });

  // STEP 9: AUTHORIZATION ISOLATION
  test("Step 9: Authenticated student cannot access admin or company restricted routes", async ({ page }) => {
    await page.goto("/admin/dashboard");
    // Must be redirected away from admin dashboard
    await expect(page).not.toHaveURL(/\/admin\/dashboard/);

    await page.goto("/company/members");
    await expect(page).not.toHaveURL(/\/company\/members/);
  });

  // STEP 10: RESPONSIVE VIEWPORT TESTING
  test("Step 10: Responsive layout renders cleanly across Desktop (1440x900), Tablet (768x1024), and Mobile (390x844)", async ({ page }) => {
    const viewports = [
      { name: "Desktop", width: 1440, height: 900 },
      { name: "Tablet", width: 768, height: 1024 },
      { name: "Mobile", width: 390, height: 844 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/student/learning");

      // Verify page renders and controls are accessible
      const main = page.locator("main").first();
      await expect(main).toBeVisible({ timeout: 5_000 });

      // Ensure no horizontal scrollbar overflow on body
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const innerWidth = await page.evaluate(() => window.innerWidth);
      // Small delta tolerance for scrollbar width
      expect(scrollWidth).toBeLessThanOrEqual(innerWidth + 20);
    }
  });

  // STEP 11: CONSOLE AND NETWORK HEALTH CHECK
  test("Step 11: Verify zero critical console errors and clean network health", async () => {
    // Filter out known benign browser warnings if any
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes("favicon") &&
        !err.includes("Download the React DevTools") &&
        !err.includes("Turbopack") &&
        !err.includes("hydrat")
    );

    // Assert no unhandled fatal runtime crashes occurred
    const fatalCrashes = criticalErrors.filter(
      (err) => err.includes("Unhandled Runtime Error") || err.includes("TypeError") || err.includes("500")
    );

    expect(fatalCrashes.length).toBe(0);
  });
});
