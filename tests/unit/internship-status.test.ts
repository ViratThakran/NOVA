/**
 * INTERNSHIP STATUS UI LOGIC
 *
 * Pure-function tests for the status→badge mapping used by
 * /admin/internships and /admin/internships/[id]. No database required.
 *
 * Run with: npm run test
 */

import { describe, it, expect } from "vitest";
import { getInternshipStatusMeta, INTERNSHIP_STATUSES } from "../../src/lib/internship-status";

describe("getInternshipStatusMeta", () => {
  it("renders 'draft' as a default badge", () => {
    expect(getInternshipStatusMeta("draft")).toEqual({ label: "Draft", variant: "default" });
  });

  it("renders 'open' as a success badge", () => {
    expect(getInternshipStatusMeta("open")).toEqual({ label: "Open", variant: "success" });
  });

  it("renders 'closed' as a warning badge", () => {
    expect(getInternshipStatusMeta("closed")).toEqual({ label: "Closed", variant: "warning" });
  });

  it("renders 'archived' as an info badge", () => {
    expect(getInternshipStatusMeta("archived")).toEqual({ label: "Archived", variant: "info" });
  });

  it("falls back to the raw value for an unrecognized status rather than inventing one", () => {
    const result = getInternshipStatusMeta("something_new");
    expect(result.label).toBe("something_new");
    expect(result.variant).toBe("default");
  });
});

describe("INTERNSHIP_STATUSES", () => {
  it("matches exactly the four values the internships.status CHECK constraint allows", () => {
    expect(INTERNSHIP_STATUSES).toEqual(["draft", "open", "closed", "archived"]);
  });
});
