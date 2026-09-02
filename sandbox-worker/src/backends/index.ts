export * from "./types";
export * from "./modal";

import type { SandboxLifecycle } from "../sandbox/lifecycle";
import { MockSandboxBackend } from "../sandbox/lifecycle";
import { ModalSandboxBackend } from "./modal";

/**
 * Factory function to retrieve the configured Sandbox Execution Backend
 * Defaults safely to MockSandboxBackend unless explicitly configured for modal.
 */
export function getSandboxBackend(backendType?: string): SandboxLifecycle {
  const selected = backendType || process.env.SANDBOX_BACKEND || "mock";

  if (selected.toLowerCase() === "modal") {
    return new ModalSandboxBackend();
  }

  return new MockSandboxBackend();
}
