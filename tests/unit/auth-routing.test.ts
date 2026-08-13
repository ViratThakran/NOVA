/**
 * ROLE-BASED REDIRECT LOGIC
 *
 * Pure-function tests for getDashboardPathForRoles(), the single place
 * loginAction() and requireRole() both decide "which dashboard does this
 * set of roles belong to". No database required.
 *
 * Run with: npm run test
 */

import { describe, it, expect } from "vitest";
import { getDashboardPathForRoles } from "../../src/lib/auth";

describe("getDashboardPathForRoles", () => {
  it("routes a student-only role set to the student dashboard", () => {
    expect(getDashboardPathForRoles(["student"])).toBe("/student/dashboard");
  });

  it("routes an admin role set to the admin dashboard", () => {
    expect(getDashboardPathForRoles(["admin"])).toBe("/admin/dashboard");
  });

  it("routes a super_admin role set to the admin dashboard", () => {
    expect(getDashboardPathForRoles(["super_admin"])).toBe("/admin/dashboard");
  });

  it("prioritizes admin over student when a user somehow holds both", () => {
    expect(getDashboardPathForRoles(["student", "admin"])).toBe("/admin/dashboard");
  });

  it("falls back to home for an empty role set", () => {
    expect(getDashboardPathForRoles([])).toBe("/");
  });

  it("falls back to home for a role with no recognized dashboard (e.g. company_admin)", () => {
    expect(getDashboardPathForRoles(["company_admin"])).toBe("/");
  });
});
