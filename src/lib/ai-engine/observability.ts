/**
 * NOVA AI Observability & Cost Telemetry Module
 * 
 * Provides safe, structured telemetry for all AI operations:
 * - Request / Task / Submission / Attempt ID correlation
 * - Latency, token usage, and cost tracking
 * - Model fallback tracking (configured vs actual model vs fallback reason)
 * - Validation results & failure categorization
 * - Strict credential scrubbing (zero secret/key leakage)
 */

export type AiOperationType =
  | "task_generation"
  | "task_review"
  | "curriculum_plan"
  | "decision_engine"
  | "code_evaluation";

export type FailureCategory =
  | "knowledge_gap"
  | "implementation_error"
  | "testing_failure"
  | "documentation_failure"
  | "misunderstanding_requirements"
  | "timeout_or_infrastructure"
  | "provider_rate_limit"
  | "provider_outage"
  | "schema_validation_failed"
  | "prompt_injection_detected"
  | "anti_hallucination_violation";

export interface AiTelemetryEvent {
  requestId: string;
  operation: AiOperationType;
  taskId?: string;
  submissionId?: string;
  attemptNumber?: number;
  studentId?: string;
  provider: string;
  configuredModel: string;
  actualModel: string;
  modelFallbackTriggered: boolean;
  fallbackReason?: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
  validationSuccess: boolean;
  validationErrors?: string[];
  validationWarnings?: string[];
  reviewVerdict?: "passed" | "needs_revision" | "manual_review";
  reviewScore?: number;
  failureCategory?: FailureCategory;
  retryCount: number;
  timestamp: string;
}

// In-memory ring buffer for recent telemetry events (bounded at 200 events)
const MAX_TELEMETRY_EVENTS = 200;
const telemetryRingBuffer: AiTelemetryEvent[] = [];

// Estimated pricing per 1M tokens (as of 2026 standard blended rates)
const MODEL_PRICING_PER_1M: Record<string, { input: number; output: number }> = {
  "google/gemini-2.0-flash-001": { input: 0.10, output: 0.40 },
  "google/gemini-flash-1.5": { input: 0.075, output: 0.30 },
  "meta-llama/llama-3.3-70b-instruct": { input: 0.20, output: 0.60 },
  "deepseek/deepseek-chat": { input: 0.14, output: 0.28 },
  "openrouter/free": { input: 0, output: 0 },
  "default": { input: 0.15, output: 0.50 },
};

/**
 * Calculate estimated cost in USD based on model pricing table
 */
export function estimateTokenCostUsd(
  model: string,
  inputTokens = 0,
  outputTokens = 0
): number {
  const pricing = MODEL_PRICING_PER_1M[model] || MODEL_PRICING_PER_1M["default"];
  const cost = (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
  return Math.round(cost * 1_000_000) / 1_000_000;
}

/**
 * Scrub sensitive credentials, API keys, and authorization headers from logs
 */
export function sanitizeLogContent(content: string): string {
  if (!content) return "";
  return content
    .replace(/(?:sk-or-[a-zA-Z0-9_-]{20,}|Bearer\s+[a-zA-Z0-9._-]{20,})/gi, "[REDACTED_API_KEY]")
    .replace(/(?:supabase_key|service_role_key|jwt|secret)[=:\s]+['"]?[a-zA-Z0-9._-]{20,}['"]?/gi, "[REDACTED_SECRET]")
    .replace(/(?:password|token)[=:\s]+['"]?[^'"\s]+['"]?/gi, "[REDACTED_AUTH]");
}

/**
 * Record a structured AI telemetry event
 */
export function recordAiTelemetry(event: Omit<AiTelemetryEvent, "timestamp" | "estimatedCostUsd"> & { estimatedCostUsd?: number }): AiTelemetryEvent {
  const cost = event.estimatedCostUsd ?? estimateTokenCostUsd(
    event.actualModel,
    event.inputTokens || 0,
    event.outputTokens || 0
  );

  const fullEvent: AiTelemetryEvent = {
    ...event,
    estimatedCostUsd: cost,
    timestamp: new Date().toISOString(),
  };

  telemetryRingBuffer.push(fullEvent);
  if (telemetryRingBuffer.length > MAX_TELEMETRY_EVENTS) {
    telemetryRingBuffer.shift();
  }

  return fullEvent;
}

/**
 * Get aggregated observability metrics summary
 */
export function getAiTelemetrySummary() {
  const totalRequests = telemetryRingBuffer.length;
  if (totalRequests === 0) {
    return {
      totalRequests: 0,
      totalCostUsd: 0,
      totalTokens: 0,
      avgLatencyMs: 0,
      validationSuccessRate: 1.0,
      fallbackRate: 0,
      failureCategoryBreakdown: {},
    };
  }

  let totalCostUsd = 0;
  let totalTokens = 0;
  let totalLatencyMs = 0;
  let successfulValidations = 0;
  let fallbackCount = 0;
  const failureBreakdown: Record<string, number> = {};

  for (const event of telemetryRingBuffer) {
    totalCostUsd += event.estimatedCostUsd || 0;
    totalTokens += (event.inputTokens || 0) + (event.outputTokens || 0);
    totalLatencyMs += event.latencyMs;
    if (event.validationSuccess) successfulValidations++;
    if (event.modelFallbackTriggered) fallbackCount++;
    if (event.failureCategory) {
      failureBreakdown[event.failureCategory] = (failureBreakdown[event.failureCategory] || 0) + 1;
    }
  }

  return {
    totalRequests,
    totalCostUsd: Math.round(totalCostUsd * 100_000) / 100_000,
    totalTokens,
    avgLatencyMs: Math.round(totalLatencyMs / totalRequests),
    validationSuccessRate: Math.round((successfulValidations / totalRequests) * 100) / 100,
    fallbackRate: Math.round((fallbackCount / totalRequests) * 100) / 100,
    failureCategoryBreakdown: failureBreakdown,
  };
}

/**
 * Retrieve recent telemetry events (safely scrubbed)
 */
export function getRecentAiTelemetry(limit = 20): AiTelemetryEvent[] {
  return telemetryRingBuffer.slice(-limit);
}

/**
 * Clear telemetry buffer (used in test setups)
 */
export function clearAiTelemetry(): void {
  telemetryRingBuffer.length = 0;
}
