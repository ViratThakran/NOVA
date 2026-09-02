import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  OpenRouterProvider,
  getAiProvider,
  setAiProvider,
  resetAiProvider,
  sanitizeJsonOutput,
  MockProvider,
} from "../../src/lib/ai-engine/providers";
import { generateTask } from "../../src/lib/ai-engine/internship-mentor/generator";
import { generateInternshipReview } from "../../src/lib/ai-engine/internship-mentor/review/agent";
import {
  FULLSTACK_INTERNSHIP_DEFINITION,
  generateCurriculumPlan,
  buildStudentContext,
} from "../../src/lib/ai-engine/internship-mentor";

describe("OpenRouterProvider Unit Tests", () => {
  beforeEach(() => {
    resetAiProvider();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resetAiProvider();
    vi.restoreAllMocks();
  });

  describe("1. Initialization and Configuration", () => {
    it("initializes with provided API key and default model", () => {
      const provider = new OpenRouterProvider("dummy-test-key");
      expect(provider.name).toBe("openrouter");
      expect(provider.model).toBe("z-ai/glm-5.2:free");
    });

    it("initializes with custom model override", () => {
      const provider = new OpenRouterProvider("dummy-test-key", "meta-llama/llama-3.3-70b-instruct:free");
      expect(provider.model).toBe("meta-llama/llama-3.3-70b-instruct:free");
    });
  });

  describe("2. JSON Sanitization", () => {
    it("strips markdown code blocks (```json ... ```)", () => {
      const raw = '```json\n{"title": "Test Task"}\n```';
      expect(sanitizeJsonOutput(raw)).toBe('{"title": "Test Task"}');
    });

    it("extracts JSON object when surrounded by conversational text", () => {
      const raw = 'Here is the task you requested:\n{"title": "Valid Task", "count": 1}\nHope this helps!';
      expect(sanitizeJsonOutput(raw)).toBe('{"title": "Valid Task", "count": 1}');
    });

    it("returns plain text if no JSON structure is detected", () => {
      const raw = "Plain unformatted string";
      expect(sanitizeJsonOutput(raw)).toBe("Plain unformatted string");
    });
  });

  describe("3. Provider Selection Priority", () => {
    it("selects OpenRouterProvider when OPENROUTER_API_KEY is present", () => {
      const origOr = process.env.OPENROUTER_API_KEY;
      const origAnt = process.env.ANTHROPIC_API_KEY;

      process.env.OPENROUTER_API_KEY = "test-openrouter-key";
      process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
      resetAiProvider();

      const provider = getAiProvider();
      expect(provider.name).toBe("openrouter");
      expect(provider instanceof OpenRouterProvider).toBe(true);

      // Cleanup
      if (origOr) process.env.OPENROUTER_API_KEY = origOr;
      else delete process.env.OPENROUTER_API_KEY;

      if (origAnt) process.env.ANTHROPIC_API_KEY = origAnt;
      else delete process.env.ANTHROPIC_API_KEY;
      resetAiProvider();
    });

    it("falls back to MockProvider when no keys are present", () => {
      const origOr = process.env.OPENROUTER_API_KEY;
      const origAnt = process.env.ANTHROPIC_API_KEY;
      const origOai = process.env.OPENAI_API_KEY;
      const origGem = process.env.GEMINI_API_KEY;

      delete process.env.OPENROUTER_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      resetAiProvider();

      const provider = getAiProvider();
      expect(provider.name).toBe("mock");
      expect(provider instanceof MockProvider).toBe(true);

      // Restore
      if (origOr) process.env.OPENROUTER_API_KEY = origOr;
      if (origAnt) process.env.ANTHROPIC_API_KEY = origAnt;
      if (origOai) process.env.OPENAI_API_KEY = origOai;
      if (origGem) process.env.GEMINI_API_KEY = origGem;
      resetAiProvider();
    });
  });

  describe("4. Completion Execution and Error Handling", () => {
    it("successfully parses valid OpenRouter chat completion response", async () => {
      const mockResponseBody = {
        id: "gen-123456",
        model: "z-ai/glm-5.2:free",
        choices: [
          {
            message: {
              role: "assistant",
              content: '{"status": "ok", "message": "Success"}',
            },
          },
        ],
        usage: { prompt_tokens: 50, completion_tokens: 15, total_tokens: 65 },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponseBody,
      } as any);

      const provider = new OpenRouterProvider("mock-api-key");
      const result = await provider.complete({
        systemPrompt: "System instruction",
        userPrompt: "User question",
        responseFormat: "internship_task",
      });

      expect(result).toBe('{"status": "ok", "message": "Success"}');
    });

    it("throws clear error on HTTP 401 Unauthorized", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: "Invalid API key" } }),
      } as any);

      const provider = new OpenRouterProvider("invalid-key");
      await expect(
        provider.complete({ systemPrompt: "Sys", userPrompt: "User", responseFormat: "internship_task" })
      ).rejects.toThrow("OpenRouter API request failed with status 401");
    });

    it("throws clear error on HTTP 429 Rate Limit", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: "Rate limit exceeded" } }),
      } as any);

      const provider = new OpenRouterProvider("rate-limited-key");
      await expect(
        provider.complete({ systemPrompt: "Sys", userPrompt: "User", responseFormat: "internship_task" })
      ).rejects.toThrow("OpenRouter API request failed with status 429");
    });

    it("throws error when response contains empty content", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: "" } }] }),
      } as any);

      const provider = new OpenRouterProvider("test-key");
      await expect(
        provider.complete({ systemPrompt: "Sys", userPrompt: "User", responseFormat: "internship_task" })
      ).rejects.toThrow("OpenRouter API returned no text content");
    });
  });

  describe("5. Structured Task and Review Generation with OpenRouter", () => {
    it("generates a validated 15-field task from OpenRouter response", async () => {
      const mockTaskJson = JSON.stringify({
        title: "Build Resident Lease Agreement REST API",
        business_context: "The resident portal requires automated digital lease contract generation.",
        role_responsibility: "Backend API Engineer",
        objective: "Design and implement lease creation, query, and signing endpoints.",
        technical_requirements: ["Node.js", "Express", "TypeScript", "Zod validation"],
        inputs: ["Resident ID", "Unit ID", "Lease Term"],
        instructions: [
          "1. Define the lease database schema with PostgreSQL types.",
          "2. Implement POST /api/leases with input validation.",
          "3. Implement GET /api/leases/:id with permission checks.",
          "4. Write unit tests for lease status transitions.",
        ],
        deliverables: ["src/routes/leases.ts", "src/models/lease.ts", "tests/leases.test.ts"],
        acceptance_criteria: [
          "POST /api/leases returns 201 with created lease payload",
          "Invalid payload returns 400 with field errors",
          "Unit test suite achieves >= 85% branch coverage",
        ],
        testing_requirements: {
          framework: "vitest",
          coverage_threshold: 85,
          required_test_cases: ["Create lease happy path", "Invalid date range validation"],
        },
        documentation_requirements: ["Update README with lease API endpoint docs"],
        skills_practiced: ["REST APIs", "TypeScript", "Database Schema Design"],
        estimated_hours: 6,
        difficulty: "intermediate",
        reason_for_assignment: "Student is ready for multi-entity relationship endpoints.",
        milestone_index: 1,
        capstone_connection: "Directly implements the lease lifecycle required for the Residency Capstone.",
      });

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: `\`\`\`json\n${mockTaskJson}\n\`\`\`` } }],
        }),
      } as any);

      const provider = new OpenRouterProvider("test-key");
      setAiProvider(provider);

      const internship = FULLSTACK_INTERNSHIP_DEFINITION;
      const curriculum = generateCurriculumPlan(internship);
      const studentContext = buildStudentContext({
        student: { id: "s1", name: "Alice" },
        internship,
      });

      const task = await generateTask({
        internship,
        curriculum,
        currentMilestone: curriculum.milestones[1],
        studentContext,
      });

      expect(task.title).toBe("Build Resident Lease Agreement REST API");
      expect(task.deliverables.length).toBe(3);
      expect(task.acceptance_criteria.length).toBe(3);
      expect(task.capstone_connection).toBeDefined();
    });

    it("generates a validated review from OpenRouter response", async () => {
      const mockReviewJson = JSON.stringify({
        review_id: "rev_or_1",
        submission_id: "sub_1",
        task_id: "task_1",
        attempt_number: 1,
        verdict: "passed",
        score: 92,
        summary: "Excellent implementation of lease endpoints with clean TypeScript architecture.",
        criteria_results: [
          {
            criterion: "POST /api/leases returns 201",
            status: "met",
            evidence: ["src/routes/leases.ts"],
            reason: "Endpoint properly created and returns 201 Created.",
            critical: true,
          },
        ],
        technical_quality: {
          architecture_score: 90,
          code_quality_score: 94,
          testing_score: 90,
          documentation_score: 92,
          notes: "Code structure is clean and modular.",
        },
        deliverables_evaluated: [
          {
            deliverable: "src/routes/leases.ts",
            status: "present",
            evidence_path: "src/routes/leases.ts",
          },
        ],
        strengths: ["Clean Zod validation", "Well-documented handler functions"],
        improvements: ["Add rate limiting middleware in future iterations"],
        next_step: "Advance to payment integration milestone.",
        review_engine_version: "1.0",
        created_at: new Date().toISOString(),
      });

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: mockReviewJson } }],
        }),
      } as any);

      const provider = new OpenRouterProvider("test-key");
      setAiProvider(provider);

      const internship = FULLSTACK_INTERNSHIP_DEFINITION;
      const curriculum = generateCurriculumPlan(internship);
      const studentContext = buildStudentContext({
        student: { id: "s1", name: "Alice" },
        internship,
      });

      const review = await generateInternshipReview({
        task: {
          title: "Build Lease API",
          business_context: "Context",
          objective: "Goal",
          instructions: ["Step 1"],
          deliverables: ["src/routes/leases.ts"],
          acceptance_criteria: ["POST /api/leases returns 201"],
          skills_practiced: ["REST APIs"],
          estimated_hours: 4,
          difficulty: "intermediate",
          reason_for_assignment: "Reason",
          milestone_index: 1,
        },
        internship,
        currentMilestone: curriculum.milestones[1],
        studentContext,
        currentSubmission: {
          id: "sub_1",
          task_id: "task_1",
          student_id: "s1",
          enrollment_id: "e1",
          submission_type: "github",
          github_url: "https://github.com/alice/leases",
          branch: "main",
          commit_sha: "c0ffee1",
          student_explanation: "Implemented lease endpoints",
          attempt_number: 1,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        },
        evidence: {
          collected_at: new Date().toISOString(),
          repository: {
            name: "leases",
            owner: "alice",
            default_branch: "main",
            topics: [],
            languages: ["TypeScript"],
            is_private: false,
          },
          collection_status: "success",
          file_tree: [{ path: "src/routes/leases.ts", type: "file" }],
          source_files: [{ path: "src/routes/leases.ts", content: "export const leaseRouter = {};", line_count: 1 }],
          test_files: [],
          config_files: [],
        },
      });

      expect(review.verdict).toBe("passed");
      expect(review.score).toBe(92);
      expect(review.strengths.length).toBe(2);
    });
  });
});
