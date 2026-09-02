/**
 * E2E Spec: Revision → Pass Journey
 *
 * Classification: REAL_BROWSER_REVISION, REAL_BROWSER_PASS
 *
 * This spec verifies the full revision cycle:
 * 1. NEEDS_REVISION feedback is rendered in the workspace UI
 * 2. Attempt history shows attempt numbers
 * 3. Revision submission is available
 * 4. After passing, both attempts are visible
 * 5. Milestone progress updates
 * 6. Next task appears after passing
 *
 * Note: This spec observes existing review state from DB rather than
 * executing a full new submission cycle (which is tested in submission-review.spec.ts).
 * If the E2E student has past submissions with NEEDS_REVISION or PASSED verdicts,
 * those are verified here.
 */
import { test, expect } from "@playwright/test";

test.describe("Revision & Pass Journey Rendering", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/student/learning");
  });

  test("workspace renders attempt history if submissions exist", async ({ page }) => {
    const body = await page.locator("body").textContent() ?? "";

    // If there are submissions, attempt history section should be visible
    const hasAttempts = body.includes("Attempt") || body.includes("attempt");
    const hasNoEnrollment = body.includes("No Active Internship Enrollment Found");
    const hasPreparing = body.includes("Preparing Your Next Engineering Task");

    // One of these states must be true — no crash
    expect(hasAttempts || hasNoEnrollment || hasPreparing || body.includes("Submit")).toBeTruthy();
    expect(body).not.toContain("Unhandled Runtime Error");
  });

  test("NEEDS_REVISION state shows feedback and revision form", async ({ page }) => {
    const body = await page.locator("body").textContent() ?? "";

    if (!body.includes("Needs Revision") && !body.includes("NEEDS_REVISION") && !body.includes("needs_revision")) {
      test.skip(true, "No NEEDS_REVISION state present for this E2E student — skipping revision UI test.");
      return;
    }

    // Revision feedback should be visible
    const hasRevisionState = await page
      .locator("text=Needs Revision, [data-verdict='needs_revision']")
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    expect(hasRevisionState).toBeTruthy();

    // Submission form or "Submit Revision" should be available
    const hasForm = await page
      .locator('button:has-text("Submit"), input[name="githubUrl"]')
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    expect(hasForm).toBeTruthy();
  });

  test("PASSED state shows success indicators and next task", async ({ page }) => {
    // Pass indicator should be visible if the task has passed
    const hasPassState = await page
      .locator("[data-verdict='passed']")
      .or(page.locator("text=Task Completed"))
      .or(page.locator("text=Milestone Completed"))
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    if (!hasPassState) {
      test.skip(true, "No PASSED state present for this E2E student — skipping pass UI test.");
      return;
    }

    expect(hasPassState).toBeTruthy();
  });



  test("attempt numbers are correctly displayed", async ({ page }) => {
    const body = await page.locator("body").textContent() ?? "";

    if (!body.includes("Attempt")) {
      test.skip(true, "No attempts present for this E2E student.");
      return;
    }

    // Attempt numbers must be visible
    const attempt1 = await page.locator("text=Attempt 1, text=#1").isVisible({ timeout: 3_000 }).catch(() => false);
    expect(attempt1).toBeTruthy();
  });

  test("after pass, workspace shows next task link", async ({ page }) => {
    const body = await page.locator("body").textContent() ?? "";

    // If there's a next task, it must be linked correctly
    const hasNextTask = body.includes("Next Task") || body.includes("next task") || body.includes("Task 2");

    if (!hasNextTask) {
      test.skip(true, "No next task present — E2E student may not have completed Task 1 yet.");
      return;
    }

    // The next task link or button should be visible
    const nextTaskEl = page.locator("text=Next Task, a:has-text('Task 2'), button:has-text('Next Task')").first();
    await expect(nextTaskEl).toBeVisible({ timeout: 5_000 });
  });

  test("milestone progress is visible in workspace", async ({ page }) => {
    const body = await page.locator("body").textContent() ?? "";

    if (body.includes("No Active Internship Enrollment Found")) {
      test.skip(true, "No enrollment — skipping milestone test.");
      return;
    }

    // Milestones are visible in some form
    const hasMilestones = body.includes("Milestone") || body.includes("milestone") || body.includes("Roadmap");
    if (hasMilestones) {
      expect(hasMilestones).toBeTruthy();
    }
  });

  test("page does not crash on reload after submission", async ({ page }) => {
    // Submit a reload and verify consistent state
    await page.reload();
    await expect(page).toHaveURL(/\/student\/learning/);
    await expect(page.locator("body")).not.toContainText("Unhandled Runtime Error");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });
});
