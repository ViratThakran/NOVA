// AI Engine configuration constants — the small set of tunable numbers
// that were previously scattered as inline literals across the provider,
// tools, and orchestrator modules. Centralized here so a future change
// (e.g. a different provider's token limit, a longer search timeout) is a
// one-line edit in one file, not a hunt across the engine.

// providers/
export const ANTHROPIC_MODEL = "claude-sonnet-5";
export const ANTHROPIC_MAX_TOKENS = 2048;

// tools/ — real web search is off by default (no credential is invented);
// set ENABLE_REAL_WEB_SEARCH=true to use the real, keyless DuckDuckGo path.
export const ENABLE_REAL_WEB_SEARCH_ENV_VAR = "ENABLE_REAL_WEB_SEARCH";
export const MAX_WEB_SEARCH_RESULTS = 5;
export const WEB_SEARCH_TIMEOUT_MS = 5000;

// workflows/orchestrator.ts — defensive recursion cap for the auto-advance
// chain. The real guarantee is structural (fixed-size workflow definitions,
// per-task retry_count/max_retries, RPC-level state-machine guards); this
// is a second, independent bound.
export const MAX_AUTO_ADVANCE_STEPS = 10;
