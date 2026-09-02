# NOVA AI Internship Mentor — Phase 3 Architecture Specification

**Title:** Persistent Internship State & Secure Runtime Verification Sandbox  
**Document Version:** 1.0  
**Status:** Implementation Complete & Validated  
**Target Milestone:** Phase 3  

---

## 1. Executive Summary & Core Principles

Phase 3 introduces **factual runtime verification** to the NOVA AI Internship Mentor while guaranteeing zero risk of host server compromise, credential exfiltration, or denial of service attacks from untrusted student repositories.

```text
                     ASSIGNED TASK
                           ↓
                   STUDENT REAL WORK
                           ↓
                   GITHUB SUBMISSION
                 (Pinned Commit SHA: SHA_N)
                           ↓
           ┌───────────────┴───────────────┐
           ↓                               ↓
SAFE STATIC EVIDENCE             SECURE SANDBOX EXECUTION
   (Zero Code Exec)               (Allowlisted Test Policy,
           ↓                       Network Deny, Resource Limits)
STATIC EVIDENCE                            ↓
MODEL & FILE TREE                  RUNTIME EVIDENCE
           │                      (Tests, Build, Lint, Logs)
           └───────────────┬───────────────┘
                           ↓
                  COMBINED REVIEW CONTEXT
                           ↓
                    AI REVIEW AGENT
            (Static Analysis + Runtime Facts)
                           ↓
                   REVIEW VALIDATOR
          (Anti-Hallucination + Conflict Policy)
                           ↓
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                  ↓
      PASS           NEEDS_REVISION     MANUAL_REVIEW
        ↓                  ↓                  ↓
Update Student Context  Preserve Attempt   Mentor Intervention
& Progress State        & Actionable Step
```

### Core Architecture Principles:
1. **Out-of-Process Isolation Boundary:** Untrusted student code is never executed inside the Next.js web process, API route handlers, or the host application container.
2. **Commit SHA Pinning:** Every student submission resolves and records an immutable Git commit SHA (`commit_sha`). Static analysis, test execution, and AI reviews evaluate the identical immutable snapshot across all attempts ($Attempt_1 \to SHA_A$, $Attempt_2 \to SHA_B$).
3. **Strict Command Allowlisting:** Students cannot specify arbitrary shell commands (`curl`, `wget`, `bash`, `rm`, `sudo`). Commands are derived strictly from allowlisted verification profiles (`node_typescript`, `python`).
4. **Zero Production Secret Leakage:** Execution workers run in a sanitized environment with zero application credentials, database keys, or API tokens passed to the guest.
5. **Multi-Signal Grounding:** AI Mentor reviews combine static AST evidence with factual test results produced exclusively by the isolated runner.
6. **Infrastructure Failure != Student Failure:** Infrastructure outages or timeouts route to `verification_unavailable` and never penalize the student with a score of 0.

---

## 2. Database Schema & State Persistence

Phase 3 persistence is defined in [`supabase/migrations/20260831000000_internship_mentor_phase3.sql`](file:///c:/Users/virat/NOVA/supabase/migrations/20260831000000_internship_mentor_phase3.sql) and protected by Row Level Security (RLS).

### Entity-Relationship Diagram:

```text
+-----------------------+       +----------------------------+
|   internship_tasks    | 1   N |   internship_submissions   |
|-----------------------|<----->|----------------------------|
| id (PK)               |       | id (PK)                    |
| enrollment_id (FK)    |       | task_id (FK)               |
| student_id (FK)       |       | student_id (FK)            |
| title                 |       | commit_sha (Pinned)        |
| acceptance_criteria   |       | attempt_number             |
| difficulty            |       | status                     |
+-----------------------+       +----------------------------+
                                       | 1            | 1
                                       |              |
                                       | N            | 1
                                       v              v
                        +--------------------+  +----------------------+
                        |   execution_jobs   |  |  internship_reviews  |
                        |--------------------|  |----------------------|
                        | id (PK)            |  | id (PK)              |
                        | submission_id (FK) |  | submission_id (FK)   |
                        | commit_sha         |  | verdict              |
                        | execution_profile  |  | score (0-100)        |
                        | status             |  | criteria_results     |
                        | runner_version     |  | technical_quality    |
                        +--------------------+  +----------------------+
                                  | 1
                                  |
                                  | 1
                                  v
                        +--------------------+
                        | runtime_evidences  |
                        |--------------------|
                        | id (PK)            |
                        | execution_job_id   |
                        | submission_id (FK) |
                        | exit_code          |
                        | duration_ms        |
                        | tests_summary      |
                        | bounded_stdout     |
                        | bounded_stderr     |
                        +--------------------+
```

---

## 3. Sandbox Security Model & Policies

### 1. Execution Profiles & Command Allowlists
Located in [`src/lib/ai-engine/internship-mentor/sandbox/policy.ts`](file:///c:/Users/virat/NOVA/src/lib/ai-engine/internship-mentor/sandbox/policy.ts):
- `node_typescript`:
  - Default Test Command: `npm test -- --runInBand --ci`
  - Approved Commands: `npm test`, `npm run test`, `npm run lint`, `npm run build`, `npx jest --ci --runInBand`, `npx vitest run`
- `python`:
  - Default Test Command: `pytest -v --tb=short`
  - Approved Commands: `python -m pytest -v --tb=short`, `pytest`, `flake8`, `ruff check .`
- Unsupported languages safely route to `unsupported_runtime` / `manual_review`.

### 2. Resource & Process Limits
- **Execution Timeout:** 60 seconds (Hard OS/hypervisor process termination; runner status $\to$ `timed_out`, exit code 124).
- **Memory Cap:** 512 MB (Exceeding limit triggers memory cgroup kill; status $\to$ `resource_exceeded`, exit code 137).
- **CPU Quota:** 1.0 vCPU quota via CFS bandwidth capping.
- **Process Ceiling:** `pids.max = 16` (Fork bomb prevention).
- **Log Buffer Bounding:** Max 64 KB stdout, 64 KB stderr. Excess stream output is truncated.
- **Network Policy:** `NETWORK = DENY` by default. Egress to cloud metadata (`http://169.254.169.254`), Supabase (`127.0.0.1:54321`), and external web is physically blocked.

---

## 4. Multi-Signal AI Review & Anti-Hallucination Guardrails

Located in [`src/lib/ai-engine/internship-mentor/review/validator.ts`](file:///c:/Users/virat/NOVA/src/lib/ai-engine/internship-mentor/review/validator.ts):
1. **Anti-Hallucination Runtime Verification:**
   - AI review cannot claim tests passed unless `runtimeEvidence.exit_code === 0` and `failed === 0`.
2. **Conflicting Evidence Guard:**
   - If static code exists (e.g. 404 handler) but runtime execution shows a failing test, the criterion status is forced to `not_met` / `partially_met` and the verdict is forced to `needs_revision`.
3. **Prompt Injection Defense:**
   - Student repository text is isolated inside `<UNTRUSTED_REPOSITORY_EVIDENCE>` delimiters.
   - The deterministic validator validates raw exit codes and test counts, overriding any model hallucinations caused by prompt injection in README or code comments.

---

## 5. Security Claim Classification

| Capability | Policy Defined | Enforcement Layer | Classification |
| :--- | :--- | :--- | :--- |
| **Command Allowlisting** | Only approved `npm test` / `pytest` commands | Application Policy Layer | **`PROVEN`** |
| **Commit SHA Pinning** | Immutable Git commit SHA recorded per attempt | Submission Pipeline & Storage | **`PROVEN`** |
| **Log Output Bounding** | Max 64KB stdout / 64KB stderr | Stream Pipe Truncation Reader | **`PROVEN`** |
| **Prompt Injection Defense** | LLM cannot pass code if raw test runner exit code $\neq 0$ | Deterministic Review Validator | **`PROVEN`** |
| **Anti-Hallucination Runtime Guard** | AI cannot claim "tests passed" without runtime evidence | Review Validator | **`PROVEN`** |
| **Secret Sanitization** | `process.env` stripped before launching sandbox | Worker Environment Sanitization | **`PROVEN`** |
| **Local Deterministic Test Simulation** | Mock runner for fast unit testing & schema validation | `DeterministicMockRunner` | **`PROVEN`** |
| **Hardware MicroVM Isolation (Production)** | Firecracker / gVisor out-of-process isolation | Production MicroVM Hypervisor | **`IMPLEMENTED_BUT_NOT_SECURITY_PROVEN`** |
| **Unrestricted Dynamic Dependency Download** | Arbitrary dynamic package installation | N/A | **`NOT_IMPLEMENTED`** (Intentionally disabled) |
