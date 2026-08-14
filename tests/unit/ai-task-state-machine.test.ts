/**
 * AI TASK STATE MACHINE TESTS — Phase 8C
 *
 * Pure logic tests mirroring the transition rules enforced across
 * assign_ai_task() / start_agent_run() / complete_agent_run() /
 * request_ai_task_approval() / decide_ai_approval() / cancel_ai_task() in
 * the DB migration. No database required — same convention as
 * tests/unit/state-machine.test.ts for applications.
 *
 * Run with: npm run test
 */

import { describe, it, expect } from "vitest";

type AiTaskStatus = "pending" | "assigned" | "running" | "waiting_for_approval" | "blocked" | "failed" | "completed" | "cancelled";

// The complete transition map every RPC collectively enforces. Terminal
// states (failed, completed, cancelled) have no outgoing transitions.
const ALLOWED_TRANSITIONS: Record<AiTaskStatus, AiTaskStatus[]> = {
  pending: ["assigned", "cancelled"],
  assigned: ["running", "cancelled"],
  running: ["completed", "failed", "waiting_for_approval"],
  waiting_for_approval: ["running", "cancelled"],
  blocked: ["running", "cancelled"],
  failed: [],
  completed: [],
  cancelled: [],
};

function canTransitionAiTask(from: AiTaskStatus, to: AiTaskStatus): { allowed: boolean; reason?: string } {
  const allowedTargets = ALLOWED_TRANSITIONS[from];
  if (!allowedTargets || !allowedTargets.includes(to)) {
    return { allowed: false, reason: `Cannot move from '${from}' to '${to}'` };
  }
  return { allowed: true };
}

// cancel_ai_task()'s own narrower rule: only these four source states may
// be cancelled — 'running' must fail/complete/request approval instead.
const CANCELLABLE_STATES: AiTaskStatus[] = ["pending", "assigned", "blocked", "waiting_for_approval"];
function canCancel(from: AiTaskStatus): boolean {
  return CANCELLABLE_STATES.includes(from);
}

describe("AI task state machine", () => {
  it("allows every transition the RPCs actually implement", () => {
    const validMoves: [AiTaskStatus, AiTaskStatus][] = [
      ["pending", "assigned"],
      ["pending", "cancelled"],
      ["assigned", "running"],
      ["assigned", "cancelled"],
      ["running", "completed"],
      ["running", "failed"],
      ["running", "waiting_for_approval"],
      ["waiting_for_approval", "running"],
      ["waiting_for_approval", "cancelled"],
    ];
    for (const [from, to] of validMoves) {
      expect(canTransitionAiTask(from, to).allowed).toBe(true);
    }
  });

  it("rejects skipping a step", () => {
    expect(canTransitionAiTask("pending", "running").allowed).toBe(false);
    expect(canTransitionAiTask("assigned", "completed").allowed).toBe(false);
  });

  it("rejects any transition out of a terminal state", () => {
    for (const terminal of ["completed", "failed", "cancelled"] as AiTaskStatus[]) {
      for (const target of ["pending", "assigned", "running", "waiting_for_approval", "blocked"] as AiTaskStatus[]) {
        expect(canTransitionAiTask(terminal, target).allowed).toBe(false);
      }
    }
  });

  it("specifically rejects completed -> running (the example the spec calls out)", () => {
    const result = canTransitionAiTask("completed", "running");
    expect(result.allowed).toBe(false);
  });

  it("rejects a task moving to its own current state", () => {
    expect(canTransitionAiTask("running", "running").allowed).toBe(false);
  });
});

describe("cancel_ai_task() eligibility", () => {
  it("allows cancelling from pending, assigned, blocked, and waiting_for_approval", () => {
    for (const state of CANCELLABLE_STATES) {
      expect(canCancel(state)).toBe(true);
    }
  });

  it("does not allow cancelling a running, completed, failed, or already-cancelled task", () => {
    for (const state of ["running", "completed", "failed", "cancelled"] as AiTaskStatus[]) {
      expect(canCancel(state)).toBe(false);
    }
  });
});

describe("Capability approval policy", () => {
  // Mirrors request_ai_task_approval()'s own guard: approval can only be
  // requested for a capability whose requires_approval flag is true — the
  // classification lives in the ai_capabilities table, this just checks the
  // gate logic that reads it.
  function canRequestApprovalFor(capability: { requires_approval: boolean }): boolean {
    return capability.requires_approval === true;
  }

  it("allows requesting approval for an approval-required capability", () => {
    expect(canRequestApprovalFor({ requires_approval: true })).toBe(true);
  });

  it("rejects requesting approval for a capability that doesn't need it", () => {
    expect(canRequestApprovalFor({ requires_approval: false })).toBe(false);
  });
});

describe("Approval decision outcome", () => {
  // Mirrors decide_ai_approval()'s own mapping: approved resumes the task,
  // rejected cancels it — never anything else.
  function taskStatusAfterDecision(decision: "approved" | "rejected"): AiTaskStatus {
    return decision === "approved" ? "running" : "cancelled";
  }

  it("approval resumes the task to running", () => {
    expect(taskStatusAfterDecision("approved")).toBe("running");
  });

  it("rejection cancels the task", () => {
    expect(taskStatusAfterDecision("rejected")).toBe("cancelled");
  });
});
