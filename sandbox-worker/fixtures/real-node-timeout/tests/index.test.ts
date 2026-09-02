import { describe, it } from "vitest";

describe("Harmless Timeout Fixture", () => {
  it("deliberately runs an infinite loop inside isolated sandbox to verify 60s timeout", () => {
    const startTime = Date.now();
    // Bounded infinite loop for timeout testing
    while (Date.now() - startTime < 120000) {
      // Busy wait to trigger hypervisor timeout
    }
  });
});
