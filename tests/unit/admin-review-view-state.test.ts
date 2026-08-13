/**
 * ADMIN REVIEW UI STATE LOGIC
 *
 * Pure-function tests for the admin application review page's button-
 * visibility rules and status-filter normalization. These intentionally
 * mirror review_application() / mark_application_under_review()'s own SQL
 * guards, but never their transitions or side effects — no database
 * required.
 *
 * Run with: npm run test
 */

import { describe, it, expect } from "vitest";
import {
  canMarkUnderReview,
  canReview,
  normalizeApplicationStatusFilter,
} from "../../src/lib/admin-review-view-state";

describe("canMarkUnderReview", () => {
  it("is true only for 'pending'", () => {
    expect(canMarkUnderReview("pending")).toBe(true);
  });

  it("is false for 'under_review', 'accepted', 'rejected'", () => {
    expect(canMarkUnderReview("under_review")).toBe(false);
    expect(canMarkUnderReview("accepted")).toBe(false);
    expect(canMarkUnderReview("rejected")).toBe(false);
  });
});

describe("canReview", () => {
  it("is true for 'pending' and 'under_review'", () => {
    expect(canReview("pending")).toBe(true);
    expect(canReview("under_review")).toBe(true);
  });

  it("is false for terminal states 'accepted' and 'rejected'", () => {
    expect(canReview("accepted")).toBe(false);
    expect(canReview("rejected")).toBe(false);
  });
});

describe("normalizeApplicationStatusFilter", () => {
  it("defaults to 'all' when no filter is provided", () => {
    expect(normalizeApplicationStatusFilter(undefined)).toBe("all");
  });

  it("accepts each real application status", () => {
    expect(normalizeApplicationStatusFilter("pending")).toBe("pending");
    expect(normalizeApplicationStatusFilter("under_review")).toBe("under_review");
    expect(normalizeApplicationStatusFilter("accepted")).toBe("accepted");
    expect(normalizeApplicationStatusFilter("rejected")).toBe("rejected");
  });

  it("accepts 'all' explicitly", () => {
    expect(normalizeApplicationStatusFilter("all")).toBe("all");
  });

  it("falls back to 'all' for an invented/unrecognized status rather than passing it through", () => {
    expect(normalizeApplicationStatusFilter("approved")).toBe("all");
    expect(normalizeApplicationStatusFilter("'; DROP TABLE applications;--")).toBe("all");
  });

  it("falls back to 'all' when Next.js hands back an array (repeated ?status= params)", () => {
    expect(normalizeApplicationStatusFilter(["pending", "accepted"])).toBe("all");
  });
});
