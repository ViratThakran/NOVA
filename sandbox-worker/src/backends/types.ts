import type { ExecutionLimits, SupportedExecutionProfile } from "../types";

/**
 * Modal Sandbox Configuration
 */
export interface ModalBackendConfig {
  tokenId?: string;
  tokenSecret?: string;
  environment?: string;
  apiEndpoint?: string;
  appName?: string;
}

/**
 * Modal Sandbox Creation Options
 */
export interface ModalSandboxOptions {
  app: string;
  image: string;
  cpu: number;
  memoryMb: number;
  timeoutSeconds: number;
  blockNetwork: boolean;
  workdir: string;
  env: Record<string, string>;
  tags?: Record<string, string>;
}

/**
 * Modal Process Execution Result
 */
export interface ModalProcessResult {
  returnCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}
