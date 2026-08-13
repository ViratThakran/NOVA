/**
 * INTERNSHIP DISCOVERY SEARCH NORMALIZATION
 *
 * Pure-function tests for sanitizeInternshipSearchQuery(), the helper
 * /student/internships uses to turn the raw `q` search param into either a
 * safe ilike filter value or null (meaning: don't filter). No database or
 * rendering required.
 *
 * Run with: npm run test
 */

import { describe, it, expect } from "vitest";
import { sanitizeInternshipSearchQuery } from "../../src/lib/internship-search";

describe("sanitizeInternshipSearchQuery", () => {
  it("returns null when no query param was provided", () => {
    expect(sanitizeInternshipSearchQuery(undefined)).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(sanitizeInternshipSearchQuery("")).toBeNull();
  });

  it("returns null for a whitespace-only string", () => {
    expect(sanitizeInternshipSearchQuery("   ")).toBeNull();
  });

  it("trims surrounding whitespace from a real query", () => {
    expect(sanitizeInternshipSearchQuery("  software  ")).toBe("software");
  });

  it("passes through a normal query unchanged", () => {
    expect(sanitizeInternshipSearchQuery("Data Internship")).toBe("Data Internship");
  });

  it("caps an excessively long query at 100 characters", () => {
    const long = "a".repeat(500);
    const result = sanitizeInternshipSearchQuery(long);
    expect(result).toHaveLength(100);
  });

  it("returns null when Next.js hands back an array (repeated ?q= params)", () => {
    expect(sanitizeInternshipSearchQuery(["a", "b"])).toBeNull();
  });
});
