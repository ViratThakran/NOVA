/**
 * APPLICATION UI STATE LOGIC
 *
 * Pure-function tests for the status→badge mapping and the internship
 * detail page's apply/already-applied/unavailable decision — both used
 * directly by the Phase 4C student pages. No database or rendering required.
 *
 * Run with: npm run test
 */

import { describe, it, expect } from "vitest";
import { getApplicationStatusMeta, getInternshipApplyViewState } from "../../src/lib/application-view-state";

describe("getApplicationStatusMeta", () => {
  it("renders 'pending' as a warning badge", () => {
    expect(getApplicationStatusMeta("pending")).toEqual({ label: "Pending", variant: "warning" });
  });

  it("renders 'under_review' as an info badge", () => {
    expect(getApplicationStatusMeta("under_review")).toEqual({ label: "Under review", variant: "info" });
  });

  it("renders 'accepted' as a success badge", () => {
    expect(getApplicationStatusMeta("accepted")).toEqual({ label: "Accepted", variant: "success" });
  });

  it("renders 'rejected' as an error badge", () => {
    expect(getApplicationStatusMeta("rejected")).toEqual({ label: "Rejected", variant: "error" });
  });

  it("falls back to the raw value for an unrecognized status rather than inventing one", () => {
    const result = getApplicationStatusMeta("something_new");
    expect(result.label).toBe("something_new");
    expect(result.variant).toBe("default");
  });
});

describe("getInternshipApplyViewState", () => {
  it("returns 'unavailable' when the internship itself isn't available, regardless of application state", () => {
    expect(
      getInternshipApplyViewState({ internshipAvailable: false, hasExistingApplication: false })
    ).toBe("unavailable");
    expect(
      getInternshipApplyViewState({ internshipAvailable: false, hasExistingApplication: true })
    ).toBe("unavailable");
  });

  it("returns 'already_applied' when available and the student already applied", () => {
    expect(
      getInternshipApplyViewState({ internshipAvailable: true, hasExistingApplication: true })
    ).toBe("already_applied");
  });

  it("returns 'can_apply' when available and no existing application", () => {
    expect(
      getInternshipApplyViewState({ internshipAvailable: true, hasExistingApplication: false })
    ).toBe("can_apply");
  });
});
