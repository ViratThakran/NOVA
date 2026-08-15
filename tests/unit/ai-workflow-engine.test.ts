/**
 * WORKFLOW ENGINE + TYPED WORKFLOW DEFINITION TESTS (Phase 8E)
 *
 * decideNextWorkflowStep() is the pure decision core of workflow-engine.ts —
 * no database, no network. Exercises: forward advancement, dependency
 * gating, the QA-fail-returns-to-Developer branch, approval/blocked stalls,
 * and workflow lookup by service/slug.
 *
 * Run with: npm run test
 */

import { describe, it, expect } from "vitest";
import { decideNextWorkflowStep, isRecord, type WorkflowTaskState } from "../../src/lib/ai-engine/workflows/orchestrator";
import { WEBSITE_CREATION_WORKFLOW } from "../../src/lib/ai-engine/workflows/website";
import { findWorkflowForService, findWorkflowBySlug } from "../../src/lib/ai-engine/workflows/registry";

function state(key: string, status: string, output: unknown = null): WorkflowTaskState {
  return { key, status, output };
}

describe("isRecord", () => {
  it("accepts plain objects", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ a: 1 })).toBe(true);
  });
  it("rejects null, arrays-as-primitives are still objects, strings/numbers are not", () => {
    expect(isRecord(null)).toBe(false);
    expect(isRecord("x")).toBe(false);
    expect(isRecord(42)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
  });
});

describe("decideNextWorkflowStep()", () => {
  it("advances to the first task when nothing has run yet", () => {
    const states = new Map([
      ["research", state("research", "pending")],
      ["development", state("development", "pending")],
      ["qa", state("qa", "pending")],
      ["deployment", state("deployment", "pending")],
    ]);
    expect(decideNextWorkflowStep(WEBSITE_CREATION_WORKFLOW, states)).toEqual({ action: "advance", nextKey: "research" });
  });

  it("advances to development once research completes successfully", () => {
    const states = new Map([
      ["research", state("research", "completed", { summary: "x", findings: ["a"], sources: [] })],
      ["development", state("development", "pending")],
      ["qa", state("qa", "pending")],
      ["deployment", state("deployment", "pending")],
    ]);
    expect(decideNextWorkflowStep(WEBSITE_CREATION_WORKFLOW, states)).toEqual({ action: "advance", nextKey: "development" });
  });

  it("waits when the dependency has not completed yet", () => {
    const states = new Map([
      ["research", state("research", "running")],
      ["development", state("development", "pending")],
    ]);
    expect(decideNextWorkflowStep(WEBSITE_CREATION_WORKFLOW, states)).toEqual({ action: "wait" });
  });

  it("routes back to development when QA reports a failed verdict", () => {
    const states = new Map([
      ["research", state("research", "completed", { summary: "x", findings: ["a"], sources: [] })],
      ["development", state("development", "completed", { file_count: 2, filenames: ["index.html", "styles.css"] })],
      ["qa", state("qa", "completed", { status: "failed", issues: ["broken"], recommendations: [], confidence: 0.9 })],
      ["deployment", state("deployment", "pending")],
    ]);
    expect(decideNextWorkflowStep(WEBSITE_CREATION_WORKFLOW, states)).toEqual({ action: "return_for_revision", returnToKey: "development" });
  });

  it("advances to deployment when QA passes", () => {
    const states = new Map([
      ["research", state("research", "completed", { summary: "x", findings: ["a"], sources: [] })],
      ["development", state("development", "completed", { file_count: 2, filenames: ["index.html", "styles.css"] })],
      ["qa", state("qa", "completed", { status: "passed", issues: [], recommendations: [], confidence: 0.95 })],
      ["deployment", state("deployment", "pending")],
    ]);
    expect(decideNextWorkflowStep(WEBSITE_CREATION_WORKFLOW, states)).toEqual({ action: "advance", nextKey: "deployment" });
  });

  it("waits once deployment is waiting for approval", () => {
    const states = new Map([
      ["research", state("research", "completed", { summary: "x", findings: ["a"], sources: [] })],
      ["development", state("development", "completed", { file_count: 1, filenames: ["index.html"] })],
      ["qa", state("qa", "completed", { status: "passed", issues: [], recommendations: [], confidence: 0.9 })],
      ["deployment", state("deployment", "waiting_for_approval")],
    ]);
    expect(decideNextWorkflowStep(WEBSITE_CREATION_WORKFLOW, states)).toEqual({ action: "wait" });
  });

  it("waits once every task is completed (workflow finished)", () => {
    const states = new Map([
      ["research", state("research", "completed", { summary: "x", findings: ["a"], sources: [] })],
      ["development", state("development", "completed", { file_count: 1, filenames: ["index.html"] })],
      ["qa", state("qa", "completed", { status: "passed", issues: [], recommendations: [], confidence: 0.9 })],
      ["deployment", state("deployment", "completed", { url: "https://example.test" })],
    ]);
    expect(decideNextWorkflowStep(WEBSITE_CREATION_WORKFLOW, states)).toEqual({ action: "wait" });
  });

  it("waits when a task is missing from the state map entirely", () => {
    const states = new Map<string, WorkflowTaskState>();
    expect(decideNextWorkflowStep(WEBSITE_CREATION_WORKFLOW, states)).toEqual({ action: "wait" });
  });
});

describe("findWorkflowForService / findWorkflowBySlug", () => {
  it("finds the website-creation workflow by its service slug", () => {
    expect(findWorkflowForService("ai-website-creation")?.slug).toBe("website-creation");
  });

  it("returns null for a service with no defined workflow", () => {
    expect(findWorkflowForService("website-seo-optimization")).toBeNull();
  });

  it("finds a workflow by its own slug", () => {
    expect(findWorkflowBySlug("website-creation")?.serviceSlugs).toContain("ai-website-creation");
  });

  it("returns null for an unknown workflow slug", () => {
    expect(findWorkflowBySlug("does-not-exist")).toBeNull();
  });
});
