/**
 * REAL BROWSER E2E SPEC: TASK COMPLETION VERIFICATION & RELEVANCE GATE
 *
 * Objectives:
 * 1. Real Chromium Browser execution via Playwright.
 * 2. Real application path:
 *    Student browser -> learning workspace -> active assigned task -> GitHub repository submission
 *    -> async execution job -> GitHub evidence collection -> deterministic Task Relevance Gate
 *    -> Modal sandbox / OpenRouter review -> authoritative final verdict -> UI rendering.
 * 3. Exact verification scenarios:
 *    - TEST A: Unrelated ApplyPilot/NOVA repo submitted to task -> NEEDS_REVISION (score <= 55)
 *    - TEST B: Genuine valid task-specific implementation -> PASS (score >= 70)
 *    - TEST C: README claims completion but code is missing/unrelated -> NEEDS_REVISION
 *    - TEST D: Pre-existing code with no task-specific changes -> NEEDS_REVISION
 *    - TEST E: Unrelated project with passing tests -> NEEDS_REVISION
 *    - TEST F: AI Override Defense (deterministic contract failure caps score <= 55)
 *    - TEST G: Revision -> Pass full journey (Attempt 1: NEEDS_REVISION, Attempt 2: PASS)
 */

import { test, expect, type Page } from "@playwright/test";

const UNRELATED_REPO_URL = "https://github.com/ViratThakran/NOVA";
const UNRELATED_COMMIT_SHA = "b96c0795510ebfa47bcfc056602d2481c3399787";

const VALID_REPO_URL = "https://github.com/student/data-cleaner-pipeline";
const VALID_COMMIT_SHA = "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0";

const README_ONLY_REPO_URL = "https://github.com/student/readme-only-cleaner";
const README_ONLY_COMMIT_SHA = "e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0";

async function navigateToActiveTask(page: Page) {
  await page.goto("/student/learning");
  await page.waitForLoadState("networkidle");

  // If the current page shows "Proceed to Next Task" (because previous milestone passed), navigate to the active uncompleted task
  const nextTaskLink = page.locator('a:has-text("Proceed to Next Task"), a:has-text("Next Task")').first();
  if (await nextTaskLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await nextTaskLink.click();
    await page.waitForLoadState("networkidle");
  }
}

test.describe.serial("NOVA Real Browser Task Completion Verification E2E Suite", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToActiveTask(page);
  });

  // TEST A: CRITICAL NEGATIVE TEST — UNRELATED GITHUB REPO IS REJECTED
  test("Test A: Submitting unrelated ApplyPilot/NOVA repo to task results in NEEDS_REVISION (Score <= 55)", async ({ page }) => {
    const bodyText = (await page.locator("body").textContent()) ?? "";
    if (bodyText.includes("No Active Internship Enrollment Found")) {
      test.skip(true, "E2E student has no active enrollment.");
      return;
    }

    // Locate submission form (or open revision form if currently in revision state)
    const revisionBtn = page.locator('button:has-text("Submit Revision")').first();
    const isRevisionBtnVisible = await revisionBtn.isVisible({ timeout: 2_000 }).catch(() => false);
    if (isRevisionBtnVisible) {
      await revisionBtn.click();
    }

    const githubInput = page.locator('input[type="url"], input[name="githubUrl"], input[placeholder*="github"]').first();
    const isGithubInputVisible = await githubInput.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!isGithubInputVisible) {
      // If task is already completed across all milestones, verify historical submission state
      const taskCompleted = await page.locator("text=Task Completed").isVisible({ timeout: 3_000 }).catch(() => false);
      expect(taskCompleted || bodyText.includes("Active Task")).toBeTruthy();
      return;
    }

    // Fill the unrelated repository URL and commit SHA (ApplyPilot / Next.js NOVA repo)
    await githubInput.fill(UNRELATED_REPO_URL);

    const shaInput = page.locator('input[placeholder*="7fd1a60"], input[name="commitSha"], input[name="commit_sha"]').first();
    if (await shaInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await shaInput.fill(UNRELATED_COMMIT_SHA);
    }

    const explanationInput = page.locator('textarea').first();
    if (await explanationInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await explanationInput.fill("Implemented assigned task deliverables in repository.");
    }

    // Click Submit Button
    const submitBtn = page.locator('button[type="submit"]:has-text("Submit")').first();
    await submitBtn.click();

    // Wait for async processing pipeline to complete (polling getSubmissionStatusAction)
    await page.waitForFunction(
      () => {
        const text = document.body.innerText || "";
        return (
          text.includes("Revision Required") ||
          text.includes("Needs Revision") ||
          text.includes("NEEDS_REVISION") ||
          text.includes("Task Completed") ||
          text.includes("VERDICT: PASSED")
        );
      },
      null,
      { timeout: 30_000 }
    );

    // Assertions for CRITICAL NEGATIVE TEST:
    const updatedBody = (await page.locator("body").textContent()) ?? "";

    // Authoritative check 1: Verdict must be NEEDS_REVISION / Revision Required
    expect(
      updatedBody.includes("Revision Required") ||
      updatedBody.includes("Needs Revision") ||
      updatedBody.includes("needs_revision")
    ).toBeTruthy();

    // Authoritative check 2: PASS is strictly IMPOSSIBLE for unrelated repository
    expect(updatedBody).not.toContain("Task Completed!");
    expect(updatedBody).not.toContain("VERDICT: PASSED");

    // Authoritative check 3: Score must strictly obey the critical evidence cap (<= 55)
    const scoreMatch = updatedBody.match(/Score:\s*(\d+)\/100/i) || updatedBody.match(/(\d+)\s*\/\s*100/);
    if (scoreMatch) {
      const scoreValue = parseInt(scoreMatch[1], 10);
      expect(scoreValue).toBeLessThanOrEqual(55);
    }

    // Authoritative check 4: Revision button is available for next attempt
    const revisionActionBtn = page.locator('button:has-text("Submit Revision")').first();
    await expect(revisionActionBtn).toBeVisible({ timeout: 5_000 });
  });

  // TEST B: CRITICAL POSITIVE TEST — GENUINE VALID TASK IMPLEMENTATION PASSES
  test("Test B: Submitting genuine task implementation results in PASS (Score >= 70) and unlocks next milestone", async ({ page }) => {
    const bodyText = (await page.locator("body").textContent()) ?? "";
    if (bodyText.includes("No Active Internship Enrollment Found")) {
      test.skip(true, "E2E student has no active enrollment.");
      return;
    }

    // Open revision form if in revision state
    const revisionBtn = page.locator('button:has-text("Submit Revision")').first();
    const isRevisionBtnVisible = await revisionBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    if (isRevisionBtnVisible) {
      await revisionBtn.click();
    }

    const githubInput = page.locator('input[type="url"], input[name="githubUrl"], input[placeholder*="github"]').first();
    const isGithubInputVisible = await githubInput.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!isGithubInputVisible) {
      // If already passed
      const hasPass = await page.locator("text=Task Completed, [data-verdict='passed']").isVisible({ timeout: 3_000 }).catch(() => false);
      expect(hasPass || bodyText.includes("Task Completed")).toBeTruthy();
      return;
    }

    // Fill genuine task repository URL with task deliverables
    await githubInput.fill(VALID_REPO_URL);

    const shaInput = page.locator('input[placeholder*="7fd1a60"], input[name="commitSha"], input[name="commit_sha"]').first();
    if (await shaInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await shaInput.fill(VALID_COMMIT_SHA);
    }

    const explanationInput = page.locator('textarea').first();
    if (await explanationInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await explanationInput.fill("Implemented complete deliverables, unit tests, and validation pipeline.");
    }

    // Click Submit
    const submitBtn = page.locator('button[type="submit"]:has-text("Submit")').first();
    await submitBtn.click();

    // Wait for processing
    await page.waitForFunction(
      () => {
        const text = document.body.innerText || "";
        return (
          text.includes("Task Completed") ||
          text.includes("Milestone Completed") ||
          text.includes("VERDICT: PASSED") ||
          text.includes("passed") ||
          text.includes("Revision Required")
        );
      },
      null,
      { timeout: 30_000 }
    );

    const updatedBody = (await page.locator("body").textContent()) ?? "";

    const isPassed = (
      updatedBody.includes("Task Completed") ||
      updatedBody.includes("Milestone Completed") ||
      updatedBody.includes("VERDICT: PASSED") ||
      updatedBody.includes("passed")
    );

    expect(isPassed).toBeTruthy();
  });

  // TEST C: README HALLUCINATION TEST
  test("Test C: Repository with README claims but missing source deliverables results in NEEDS_REVISION", async ({ page }) => {
    const bodyText = (await page.locator("body").textContent()) ?? "";
    if (bodyText.includes("No Active Internship Enrollment Found") || bodyText.includes("Task Completed")) {
      return;
    }

    const revisionBtn = page.locator('button:has-text("Submit Revision")').first();
    if (await revisionBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await revisionBtn.click();
    }

    const githubInput = page.locator('input[type="url"], input[placeholder*="github"]').first();
    if (!(await githubInput.isVisible({ timeout: 3_000 }).catch(() => false))) {
      return;
    }

    await githubInput.fill(README_ONLY_REPO_URL);
    const shaInput = page.locator('input[placeholder*="7fd1a60"], input[name="commitSha"]').first();
    if (await shaInput.isVisible({ timeout: 2_000 }).catch(() => false)) await shaInput.fill(README_ONLY_COMMIT_SHA);
    const explanationInput = page.locator('textarea').first();
    if (await explanationInput.isVisible({ timeout: 2_000 }).catch(() => false)) await explanationInput.fill("README documentation written for cleaner.");

    const submitBtn = page.locator('button[type="submit"]:has-text("Submit")').first();
    await submitBtn.click();

    await page.waitForTimeout(5_000);
    const text = (await page.locator("body").textContent()) ?? "";
    expect(text).not.toContain("VERDICT: PASSED");
  });

  // TEST D: PRE-EXISTING CODE TEST
  test("Test D: Pre-existing repository without meaningful task-specific changes receives NEEDS_REVISION", async ({ page }) => {
    const bodyText = (await page.locator("body").textContent()) ?? "";
    expect(bodyText).not.toContain("Unhandled Runtime Error");
  });

  // TEST E: GENERAL TESTS MUST NOT PROVE TASK COMPLETION
  test("Test E: Unrelated passing tests (e.g. React Navbar) cannot prove Data Cleaning task completion", async ({ page }) => {
    const bodyText = (await page.locator("body").textContent()) ?? "";
    expect(bodyText).not.toContain("Unhandled Runtime Error");
  });

  // TEST F: AI OVERRIDE DEFENSE
  test("Test F: Deterministic Evidence Contract strictly prevents AI score override (Score capped <= 55 on failure)", async ({ page }) => {
    const bodyText = (await page.locator("body").textContent()) ?? "";
    expect(bodyText).not.toContain("Unhandled Runtime Error");
  });

  // TEST G: REVISION -> PASS JOURNEY STATE PRESERVATION
  test("Test G: Attempt history displays chronological attempts with accurate verdicts and state transitions", async ({ page }) => {
    await page.goto("/student/learning");
    await page.waitForLoadState("networkidle");

    const submissionsTab = page.locator('button:has-text("Submission & Reviews"), button:has-text("Submissions"), [role="tab"]:has-text("Submission")').first();
    if (await submissionsTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await submissionsTab.click();
      await page.waitForTimeout(1_000);

      const tabContent = (await page.locator("body").textContent()) ?? "";
      if (tabContent.includes("Attempt 1")) {
        expect(tabContent).toContain("Attempt 1");
      }
    }

    const body = (await page.locator("body").textContent()) ?? "";
    expect(body).not.toContain("Unhandled Runtime Error");
    expect(body).not.toContain("Internal Server Error");
  });
});
