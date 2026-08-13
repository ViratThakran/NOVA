/**
 * APPLICATION STATE MACHINE TESTS
 *
 * Validates the allowed and disallowed state transitions for applications.
 * These are pure logic tests — no database required.
 *
 * Run with: npm run test
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// ---------------------------------------------------------------------------
// The state machine logic (mirrors what review_application() enforces in DB)
// ---------------------------------------------------------------------------

type ApplicationStatus = "pending" | "under_review" | "accepted" | "rejected";

const VALID_SOURCE_STATES: ApplicationStatus[] = ["pending", "under_review"];
const VALID_TARGET_STATES: ("accepted" | "rejected")[] = ["accepted", "rejected"];

function canTransition(from: ApplicationStatus, to: string): { allowed: boolean; reason?: string } {
  if (!VALID_SOURCE_STATES.includes(from)) {
    return { allowed: false, reason: `Application in state '${from}' cannot be reviewed` };
  }
  if (!VALID_TARGET_STATES.includes(to as any)) {
    return { allowed: false, reason: `Invalid target state '${to}'` };
  }
  return { allowed: true };
}

// ---------------------------------------------------------------------------
// Duplicate enrollment guard (mirrors the DB UNIQUE constraint logic)
// ---------------------------------------------------------------------------

type Enrollment = { student_id: string; internship_id: string; application_id: string };

function wouldCreateDuplicateEnrollment(
  existing: Enrollment[],
  candidate: Enrollment
): boolean {
  return existing.some((e) => e.application_id === candidate.application_id);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Application State Machine", () => {
  describe("Valid transitions", () => {
    it("pending → accepted is allowed", () => {
      const result = canTransition("pending", "accepted");
      expect(result.allowed).toBe(true);
    });

    it("pending → rejected is allowed", () => {
      const result = canTransition("pending", "rejected");
      expect(result.allowed).toBe(true);
    });

    it("under_review → accepted is allowed", () => {
      const result = canTransition("under_review", "accepted");
      expect(result.allowed).toBe(true);
    });

    it("under_review → rejected is allowed", () => {
      const result = canTransition("under_review", "rejected");
      expect(result.allowed).toBe(true);
    });
  });

  describe("Invalid transitions — terminal states cannot be re-reviewed", () => {
    it("accepted → rejected is BLOCKED", () => {
      const result = canTransition("accepted", "rejected");
      expect(result.allowed).toBe(false);
      expect(result.reason).toMatch(/cannot be reviewed/);
    });

    it("accepted → pending is BLOCKED", () => {
      const result = canTransition("accepted", "pending");
      expect(result.allowed).toBe(false);
    });

    it("rejected → accepted is BLOCKED", () => {
      const result = canTransition("rejected", "accepted");
      expect(result.allowed).toBe(false);
      expect(result.reason).toMatch(/cannot be reviewed/);
    });

    it("rejected → pending is BLOCKED", () => {
      const result = canTransition("rejected", "pending");
      expect(result.allowed).toBe(false);
    });
  });

  describe("Invalid target state values", () => {
    it("Transition to unknown state 'approved' is BLOCKED", () => {
      const result = canTransition("pending", "approved");
      expect(result.allowed).toBe(false);
      expect(result.reason).toMatch(/Invalid target state/);
    });

    it("Transition to 'under_review' directly by admin is BLOCKED", () => {
      const result = canTransition("pending", "under_review");
      expect(result.allowed).toBe(false);
    });
  });

  describe("Duplicate enrollment guard", () => {
    it("Detects duplicate enrollment for same application_id", () => {
      const existing: Enrollment[] = [
        {
          student_id: "user-1",
          internship_id: "internship-1",
          application_id: "app-1",
        },
      ];

      const duplicate = wouldCreateDuplicateEnrollment(existing, {
        student_id: "user-1",
        internship_id: "internship-1",
        application_id: "app-1",
      });

      expect(duplicate).toBe(true);
    });

    it("Allows new enrollment for different application_id", () => {
      const existing: Enrollment[] = [
        {
          student_id: "user-1",
          internship_id: "internship-1",
          application_id: "app-1",
        },
      ];

      const duplicate = wouldCreateDuplicateEnrollment(existing, {
        student_id: "user-1",
        internship_id: "internship-2",
        application_id: "app-2",
      });

      expect(duplicate).toBe(false);
    });
  });
});

describe("Role Escalation Prevention — Schema-Level", () => {
  const allowedPublicSignupRole = "student";

  const privilegedRoles = [
    "admin",
    "super_admin",
    "mentor",
    "employee",
    "project_manager",
    "tech_lead",
    "recruiter",
    "finance_user",
    "support_user",
    "company_admin",
    "company_member",
  ];

  // Simulate what the DB trigger enforces: only 'student' is assignable at signup
  function isAssignableAtSignup(role: string): boolean {
    return role === allowedPublicSignupRole;
  }

  it("Only 'student' is assignable at public signup", () => {
    expect(isAssignableAtSignup("student")).toBe(true);
  });

  it.each(privilegedRoles)("'%s' cannot be self-assigned at signup", (role) => {
    expect(isAssignableAtSignup(role)).toBe(false);
  });
});

describe("Audit Log Immutability — Logic Assertions", () => {
  // Simulate RLS policies in terms of permission flags
  const getAuditLogPermissions = (role: "anon" | "student" | "admin") => ({
    canSelect: role === "admin",
    canInsert: false, // No client ever can — only internal DB functions
    canUpdate: false, // Immutable
    canDelete: false, // Immutable
  });

  it("Anon users have NO access to audit logs", () => {
    const perms = getAuditLogPermissions("anon");
    expect(perms.canSelect).toBe(false);
    expect(perms.canInsert).toBe(false);
    expect(perms.canUpdate).toBe(false);
    expect(perms.canDelete).toBe(false);
  });

  it("Students have NO access to audit logs", () => {
    const perms = getAuditLogPermissions("student");
    expect(perms.canSelect).toBe(false);
    expect(perms.canInsert).toBe(false);
    expect(perms.canUpdate).toBe(false);
    expect(perms.canDelete).toBe(false);
  });

  it("Admins can only SELECT audit logs, never mutate", () => {
    const perms = getAuditLogPermissions("admin");
    expect(perms.canSelect).toBe(true);
    expect(perms.canInsert).toBe(false);
    expect(perms.canUpdate).toBe(false);
    expect(perms.canDelete).toBe(false);
  });
});
