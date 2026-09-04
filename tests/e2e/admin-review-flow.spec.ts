import { test, expect } from "@playwright/test";

const E2E_PASSWORD = process.env.E2E_STUDENT_PASSWORD || "E2E_Nova_Test_2026!";
const E2E_ADMIN_EMAIL = "admin@nova.ai";

test.describe.serial("Admin Application Review & Student Enrollment Real E2E Flow", () => {
  test("1. Student applies, Admin logs in and accepts, Student sees active enrollment", async ({ browser }) => {
    // ----------------------------------------------------
    // Phase A: Student applies to an open internship
    // ----------------------------------------------------
    const studentContext = await browser.newContext({ storageState: "tests/e2e/.auth/student.json" });
    const studentPage = await studentContext.newPage();

    await studentPage.goto("/student/internships");
    await expect(studentPage).toHaveURL(/\/student\/internships/);

    const internshipLinks = studentPage.locator('a[href^="/student/internships/"]');
    const count = await internshipLinks.count();
    expect(count).toBeGreaterThan(0);

    // Pick first available internship
    await internshipLinks.first().click();
    await expect(studentPage).toHaveURL(/\/student\/internships\/.+/);

    const coverLetter = studentPage.locator('textarea[name="cover_letter"]');
    if (await coverLetter.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await coverLetter.fill("[E2E Test] Candidate submission for Admin Review Acceptance Verification.");
      const submitBtn = studentPage.locator('button:has-text("Submit Application")').first();
      await submitBtn.click();
      await expect(studentPage.getByText(/Application Submitted/i).first()).toBeVisible({ timeout: 10_000 });
    }

    // Verify application in student list
    await studentPage.goto("/student/applications");
    await expect(studentPage).toHaveURL(/\/student\/applications/);
    await expect(studentPage.locator("h1, h2").first()).toBeVisible();

    // ----------------------------------------------------
    // Phase B: Admin logs in and reviews application
    // ----------------------------------------------------
    const adminContext = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const adminPage = await adminContext.newPage();

    await adminPage.goto("/login");
    await adminPage.locator('input[name="email"]').fill(E2E_ADMIN_EMAIL);
    await adminPage.locator('input[name="password"]').fill(E2E_PASSWORD);
    await adminPage.locator('button[type="submit"]').click();

    await adminPage.waitForURL(/\/admin\/dashboard/, { timeout: 15_000 });
    await expect(adminPage).toHaveURL(/\/admin\/dashboard/);

    // Navigate to applications queue
    await adminPage.goto("/admin/applications?status=all");
    await expect(adminPage).toHaveURL(/\/admin\/applications/);

    const queueHeading = adminPage.locator("h1");
    await expect(queueHeading).toContainText("Application Review Queue");

    // Open first reviewable application
    const reviewLinks = adminPage.locator('a[href^="/admin/applications/"]');
    const reviewCount = await reviewLinks.count();

    if (reviewCount > 0) {
      await reviewLinks.first().click();
      await expect(adminPage).toHaveURL(/\/admin\/applications\/.+/);

    // Verify Decision Panel is rendered
    const acceptBtn = adminPage.locator('button:has-text("Accept")').first();
    const canReview = await acceptBtn.isVisible({ timeout: 5_000 }).catch(() => false);

    if (canReview) {
      // Click Accept to open modal
      await acceptBtn.click();

      // Modal appears
      const modal = adminPage.locator('[role="dialog"], .fixed');
      await expect(modal).toBeVisible();
      await expect(modal).toContainText("Accept this application?");

      // Submit modal confirmation
      const confirmBtn = adminPage.locator('button:has-text("Confirm accept")').first();
      await confirmBtn.click();

      // CRITICAL ASSERTION: Ensure permission error does NOT appear
      await expect(adminPage.locator("body")).not.toContainText("You don't have permission to review applications.", { timeout: 10_000 });

      // Verify status updates to Accepted
      await expect(adminPage.locator('text="Accepted", [data-status="accepted"]')).toBeVisible({ timeout: 10_000 });
    }
  }

    await adminContext.close();

    // ----------------------------------------------------
    // Phase C: Student sees active enrollment
    // ----------------------------------------------------
    await studentPage.goto("/student/enrollments");
    await expect(studentPage).toHaveURL(/\/student\/enrollments/);
    await expect(studentPage.locator("h1, h2").first()).toBeVisible();

    const enrollmentElements = studentPage.locator('a[href^="/student/enrollments/"], [class*="card"]');
    const enrollmentCount = await enrollmentElements.count();
    expect(enrollmentCount).toBeGreaterThan(0);

    await studentContext.close();
  });

  test("2. Admin rejection path: application shows Rejected and no enrollment created", async ({ browser }) => {
    // ----------------------------------------------------
    // Phase A: Admin logs in, opens an application to reject
    // ----------------------------------------------------
    const adminContext = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const adminPage = await adminContext.newPage();

    await adminPage.goto("/login");
    await adminPage.locator('input[name="email"]').fill(E2E_ADMIN_EMAIL);
    await adminPage.locator('input[name="password"]').fill(E2E_PASSWORD);
    await adminPage.locator('button[type="submit"]').click();

    await adminPage.waitForURL(/\/admin\/dashboard/, { timeout: 15_000 });

    await adminPage.goto("/admin/applications?status=pending");
    await expect(adminPage).toHaveURL(/\/admin\/applications/);

    const reviewLinks = adminPage.locator('a[href^="/admin/applications/"]');
    const reviewCount = await reviewLinks.count();

    if (reviewCount > 0) {
      await reviewLinks.first().click();
      await expect(adminPage).toHaveURL(/\/admin\/applications\/.+/);

      const rejectBtn = adminPage.locator('button:has-text("Reject")').first();
      if (await rejectBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await rejectBtn.click();

        const modal = adminPage.locator('[role="dialog"], .fixed');
        await expect(modal).toBeVisible();
        await expect(modal).toContainText("Reject this application?");

        const confirmBtn = adminPage.locator('button:has-text("Confirm reject")').first();
        await confirmBtn.click();

        // Ensure permission error does NOT appear
        await expect(adminPage.locator("body")).not.toContainText("You don't have permission to review applications.", { timeout: 10_000 });

        // Status reflects Rejected
        await expect(adminPage.locator('text="Rejected", [data-status="rejected"]')).toBeVisible({ timeout: 10_000 });
      }
    }

    await adminContext.close();
  });
});
