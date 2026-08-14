/**
 * AI STRUCTURED OUTPUT + PURE LOGIC TESTS — Phase 8D
 *
 * Tests the real, imported modules (not re-derived copies): the Zod schemas
 * every model response is validated against, the dependency-graph
 * validator, the deterministic MockProvider, and the tool/capability
 * registry. No database or network access — MockProvider makes no real
 * calls, matching its own design.
 *
 * Run with: npm run test
 */

import { describe, it, expect } from "vitest";
import {
  taskPlanSchema,
  researchResultSchema,
  findInvalidDependencyIndex,
  websiteBuildSchema,
  qaResultSchema,
  contentDraftSchema,
  checkWebsiteBuildStructure,
} from "../../src/lib/ai/schemas";
import { MockProvider, getAiProvider } from "../../src/lib/ai/provider";
import { TOOL_CAPABILITY } from "../../src/lib/ai/tools";

describe("taskPlanSchema", () => {
  const validTask = { title: "Research", description: "Do research.", agent_slug: "research-agent", capability_slugs: ["research"], depends_on_index: null };

  it("accepts a valid multi-task plan", () => {
    const result = taskPlanSchema.safeParse({ tasks: [validTask, { ...validTask, title: "QA", depends_on_index: 0 }] });
    expect(result.success).toBe(true);
  });

  it("rejects an empty task list", () => {
    const result = taskPlanSchema.safeParse({ tasks: [] });
    expect(result.success).toBe(false);
  });

  it("rejects more than 10 tasks", () => {
    const tasks = Array.from({ length: 11 }, (_, i) => ({ ...validTask, title: `Task ${i}` }));
    const result = taskPlanSchema.safeParse({ tasks });
    expect(result.success).toBe(false);
  });

  it("rejects a task with an empty title", () => {
    const result = taskPlanSchema.safeParse({ tasks: [{ ...validTask, title: "" }] });
    expect(result.success).toBe(false);
  });

  it("defaults capability_slugs to an empty array when omitted", () => {
    const { capability_slugs, ...withoutCapabilities } = validTask;
    const result = taskPlanSchema.safeParse({ tasks: [withoutCapabilities] });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.tasks[0].capability_slugs).toEqual([]);
  });
});

describe("researchResultSchema", () => {
  it("accepts a valid result", () => {
    const result = researchResultSchema.safeParse({ summary: "x", findings: ["a", "b"], sources: [] });
    expect(result.success).toBe(true);
  });

  it("rejects a result with no findings", () => {
    const result = researchResultSchema.safeParse({ summary: "x", findings: [] });
    expect(result.success).toBe(false);
  });

  it("rejects an empty summary", () => {
    const result = researchResultSchema.safeParse({ summary: "", findings: ["a"] });
    expect(result.success).toBe(false);
  });

  it("defaults sources to an empty array when omitted", () => {
    const result = researchResultSchema.safeParse({ summary: "x", findings: ["a"] });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.sources).toEqual([]);
  });
});

describe("findInvalidDependencyIndex", () => {
  const task = (depends_on_index: number | null) => ({
    title: "t",
    description: "d",
    agent_slug: "research-agent",
    capability_slugs: [],
    depends_on_index,
  });

  it("returns null for a plan with no dependencies", () => {
    const plan = { tasks: [task(null), task(null)] };
    expect(findInvalidDependencyIndex(plan)).toBeNull();
  });

  it("returns null for a valid backward-pointing chain", () => {
    const plan = { tasks: [task(null), task(0), task(1)] };
    expect(findInvalidDependencyIndex(plan)).toBeNull();
  });

  it("flags a forward-pointing dependency", () => {
    const plan = { tasks: [task(1), task(null)] };
    expect(findInvalidDependencyIndex(plan)).toBe(0);
  });

  it("flags a self-referencing dependency", () => {
    const plan = { tasks: [task(null), task(1)] };
    expect(findInvalidDependencyIndex(plan)).toBe(1);
  });

  it("flags a negative dependency index", () => {
    const plan = { tasks: [task(-1)] };
    expect(findInvalidDependencyIndex(plan)).toBe(0);
  });
});

describe("MockProvider", () => {
  const provider = new MockProvider();

  it("returns a valid task_plan response", async () => {
    const raw = await provider.complete({ systemPrompt: "x", userPrompt: "Build a website", responseFormat: "task_plan" });
    const parsed = taskPlanSchema.parse(JSON.parse(raw));
    expect(parsed.tasks.length).toBeGreaterThan(0);
  });

  it("returns a valid research_result response", async () => {
    const raw = await provider.complete({ systemPrompt: "x", userPrompt: "Competitor research", responseFormat: "research_result" });
    const parsed = researchResultSchema.parse(JSON.parse(raw));
    expect(parsed.findings.length).toBeGreaterThan(0);
  });

  it("is deterministic — the same input produces the same output", async () => {
    const first = await provider.complete({ systemPrompt: "x", userPrompt: "Same topic", responseFormat: "research_result" });
    const second = await provider.complete({ systemPrompt: "x", userPrompt: "Same topic", responseFormat: "research_result" });
    expect(first).toBe(second);
  });

  it("reflects the actual input topic rather than being generic filler", async () => {
    const raw = await provider.complete({ systemPrompt: "x", userPrompt: "Unique topic marker 12345", responseFormat: "research_result" });
    expect(raw).toContain("Unique topic marker 12345");
  });
});

describe("Provider selection — never invents a credential", () => {
  it("falls back to the mock provider when no provider API key is configured", () => {
    // This test environment genuinely has no ANTHROPIC_API_KEY set — this
    // asserts the real fallback behavior, not a stubbed one.
    expect(process.env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(getAiProvider().name).toBe("mock");
  });
});

describe("Tool/capability registry", () => {
  it("every registered tool maps to exactly one capability slug", () => {
    for (const [tool, capability] of Object.entries(TOOL_CAPABILITY)) {
      expect(typeof tool).toBe("string");
      expect(typeof capability).toBe("string");
      expect(capability.length).toBeGreaterThan(0);
    }
  });

  it("web_search requires read_public_web, matching the Phase 8D spec's own example", () => {
    expect(TOOL_CAPABILITY.web_search).toBe("read_public_web");
  });

  it("deploy_website requires the approval-gated deploy capability (Phase 8E)", () => {
    expect(TOOL_CAPABILITY.deploy_website).toBe("deploy");
  });

  it("generate_content and publish_content_externally map to two DIFFERENT capabilities (Phase 8E separation)", () => {
    expect(TOOL_CAPABILITY.generate_content).toBe("write_draft");
    expect(TOOL_CAPABILITY.publish_content_externally).toBe("publish_content");
    expect(TOOL_CAPABILITY.generate_content).not.toBe(TOOL_CAPABILITY.publish_content_externally);
  });
});

describe("websiteBuildSchema", () => {
  const validFile = { path: "index.html", content: "<html></html>" };

  it("accepts a valid build", () => {
    expect(websiteBuildSchema.safeParse({ files: [validFile] }).success).toBe(true);
  });

  it("rejects an empty file list", () => {
    expect(websiteBuildSchema.safeParse({ files: [] }).success).toBe(false);
  });

  it("rejects more than 8 files", () => {
    const files = Array.from({ length: 9 }, (_, i) => ({ path: `f${i}.html`, content: "x" }));
    expect(websiteBuildSchema.safeParse({ files }).success).toBe(false);
  });

  it("rejects an empty file content string", () => {
    expect(websiteBuildSchema.safeParse({ files: [{ path: "a.html", content: "" }] }).success).toBe(false);
  });
});

describe("checkWebsiteBuildStructure", () => {
  it("finds no issues in a well-formed build with an index.html entry point", () => {
    const build = websiteBuildSchema.parse({ files: [{ path: "index.html", content: "<h1>Hi</h1>" }, { path: "styles.css", content: "body{}" }] });
    expect(checkWebsiteBuildStructure(build).issues).toEqual([]);
  });

  it("flags a missing index.html entry point", () => {
    const build = websiteBuildSchema.parse({ files: [{ path: "about.html", content: "<h1>About</h1>" }] });
    expect(checkWebsiteBuildStructure(build).issues.some((issue) => issue.includes("index.html"))).toBe(true);
  });

  it("flags an unresolved template placeholder", () => {
    const build = websiteBuildSchema.parse({ files: [{ path: "index.html", content: "<h1>{{business_name}}</h1>" }] });
    expect(checkWebsiteBuildStructure(build).issues.some((issue) => issue.includes("placeholder"))).toBe(true);
  });

  it("flags a leftover TODO marker", () => {
    const build = websiteBuildSchema.parse({ files: [{ path: "index.html", content: "<!-- TODO: write real copy --><h1>Site</h1>" }] });
    expect(checkWebsiteBuildStructure(build).issues.some((issue) => issue.toLowerCase().includes("todo"))).toBe(true);
  });

  it("flags duplicate file paths", () => {
    const build = { files: [{ path: "index.html", content: "a" }, { path: "INDEX.HTML", content: "b" }] };
    expect(checkWebsiteBuildStructure(build).issues.some((issue) => issue.includes("Duplicate"))).toBe(true);
  });
});

describe("qaResultSchema", () => {
  it("accepts a valid passed result", () => {
    expect(qaResultSchema.safeParse({ status: "passed", issues: [], recommendations: [], confidence: 0.9 }).success).toBe(true);
  });

  it("rejects an invalid status value", () => {
    expect(qaResultSchema.safeParse({ status: "maybe", issues: [], recommendations: [], confidence: 0.5 }).success).toBe(false);
  });

  it("rejects a confidence value outside [0, 1]", () => {
    expect(qaResultSchema.safeParse({ status: "passed", issues: [], recommendations: [], confidence: 1.5 }).success).toBe(false);
  });

  it("defaults issues/recommendations to empty arrays when omitted", () => {
    const result = qaResultSchema.safeParse({ status: "passed", confidence: 0.9 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.issues).toEqual([]);
      expect(result.data.recommendations).toEqual([]);
    }
  });
});

describe("contentDraftSchema", () => {
  it("accepts a valid draft", () => {
    expect(contentDraftSchema.safeParse({ title: "t", body: "b", format: "seo_content" }).success).toBe(true);
  });

  it("rejects an unknown format", () => {
    expect(contentDraftSchema.safeParse({ title: "t", body: "b", format: "tweet_storm" }).success).toBe(false);
  });

  it("rejects an empty body", () => {
    expect(contentDraftSchema.safeParse({ title: "t", body: "", format: "seo_content" }).success).toBe(false);
  });
});

describe("MockProvider — Phase 8E response formats", () => {
  const provider = new MockProvider();

  it("returns a valid website_build response reflecting the given topic", async () => {
    const raw = await provider.complete({ systemPrompt: "x", userPrompt: "Bakery in Austin", responseFormat: "website_build" });
    const parsed = websiteBuildSchema.parse(JSON.parse(raw));
    expect(parsed.files.some((file) => file.path === "index.html")).toBe(true);
    expect(parsed.files.some((file) => file.content.includes("Bakery in Austin"))).toBe(true);
  });

  it("returns a passed qa_result when no structural issues are signaled", async () => {
    const raw = await provider.complete({ systemPrompt: "x", userPrompt: "Task: x\nSTRUCTURAL_ISSUES:0", responseFormat: "qa_result" });
    expect(qaResultSchema.parse(JSON.parse(raw)).status).toBe("passed");
  });

  it("returns a failed qa_result when structural issues are signaled", async () => {
    const raw = await provider.complete({ systemPrompt: "x", userPrompt: "Task: x\nSTRUCTURAL_ISSUES:2", responseFormat: "qa_result" });
    expect(qaResultSchema.parse(JSON.parse(raw)).status).toBe("failed");
  });

  it("returns a valid content_draft response reflecting the requested format", async () => {
    const raw = await provider.complete({ systemPrompt: "x", userPrompt: "Brief: new product launch\nFormat: social_post", responseFormat: "content_draft" });
    const parsed = contentDraftSchema.parse(JSON.parse(raw));
    expect(parsed.format).toBe("social_post");
  });
});
