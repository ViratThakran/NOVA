import { describe, it, expect } from "vitest";

describe("Intentional Failure Test Suite", () => {
  it("deliberately fails to verify runtime failure reporting", () => {
    expect(1 + 1).toBe(3); // Intentional assertion failure
  });
});
