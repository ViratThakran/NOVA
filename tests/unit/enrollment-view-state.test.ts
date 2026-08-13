/**
 * ENROLLMENT UI STATE LOGIC
 *
 * Pure-function tests for the enrollment status→badge mapping used by
 * /student/enrollments and /student/enrollments/[id]. No database required.
 *
 * Run with: npm run test
 */

import { describe, it, expect } from "vitest";
import { getEnrollmentStatusMeta } from "../../src/lib/enrollment-view-state";

describe("getEnrollmentStatusMeta", () => {
  it("renders 'active' as an info badge", () => {
    expect(getEnrollmentStatusMeta("active")).toEqual({ label: "Active", variant: "info" });
  });

  it("renders 'completed' as a success badge", () => {
    expect(getEnrollmentStatusMeta("completed")).toEqual({ label: "Completed", variant: "success" });
  });

  it("renders 'withdrawn' as a warning badge", () => {
    expect(getEnrollmentStatusMeta("withdrawn")).toEqual({ label: "Withdrawn", variant: "warning" });
  });

  it("falls back to the raw value for an unrecognized status rather than inventing one", () => {
    const result = getEnrollmentStatusMeta("something_new");
    expect(result.label).toBe("something_new");
    expect(result.variant).toBe("default");
  });
});
