import { describe, it, expect } from "vitest";
import { addNumbers, formatStudentGreeting } from "../src";
import crypto from "crypto";

describe("Smoke Test Suite", () => {
  it("computes arithmetic sum correctly", () => {
    expect(addNumbers(2, 3)).toBe(5);
    expect(addNumbers(-1, 1)).toBe(0);
  });

  it("formats student greeting message", () => {
    expect(formatStudentGreeting("Alex")).toBe("Hello, Alex! Welcome to the NOVA AI Internship.");
  });

  it("generates and asserts dynamic runtime proof nonce inside sandbox container", () => {
    const runtimeNonce = crypto.randomUUID();
    const runtimeHash = crypto.createHash("sha256").update(runtimeNonce).digest("hex");

    // Print marker to stdout for factual execution verification
    console.log(`[RUNTIME_NONCE:${runtimeNonce}]`);
    console.log(`[RUNTIME_HASH:${runtimeHash}]`);

    expect(runtimeNonce).toBeDefined();
    expect(runtimeNonce.length).toBeGreaterThan(10);
    expect(runtimeHash.length).toBe(64);
  });
});
