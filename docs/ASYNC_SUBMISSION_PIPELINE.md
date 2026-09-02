# NOVA — ASYNCHRONOUS SUBMISSION & EXECUTION JOB PIPELINE

**Specification & Implementation Document**  
**Phase**: Stage 2 Complete  
**Engine**: Asynchronous Execution Pipeline with Atomic Job Claiming & Durable State Transitions  
**Source of Truth**: Supabase PostgreSQL (`public.execution_jobs`, `public.internship_submissions`)  

---

## 1. ARCHITECTURAL OVERVIEW

The NOVA student submission pipeline is strictly asynchronous and non-blocking:

```
+-----------------------------------------------------------------------------------+
|                           STUDENT SUBMISSION FLOW                                 |
+-----------------------------------------------------------------------------------+
  Student clicks Submit (Task ID, GitHub URL, Commit SHA, Notes)
                           │
                           ▼
  [Server Action: submitInternshipTaskAction]
    ├─ 1. Authenticate user & verify active enrollment ownership
    ├─ 2. Calculate next attempt_number server-side: max(existing) + 1
    ├─ 3. Idempotency check on (task_id, commit_sha)
    ├─ 4. Insert public.internship_submissions (status: 'submitted')
    ├─ 5. Insert public.execution_jobs (status: 'queued')
    ├─ 6. Dispatch processSubmissionJobAsync (via after() / background event)
    └─ 7. Return IMMEDIATE response to client ({ submissionId, jobId, status: 'queued' })
                           │
                           ▼ (Background Worker Execution)
+-----------------------------------------------------------------------------------+
|                        BACKGROUND WORKER PIPELINE                                 |
|                                                                                   |
|  [1. ATOMIC JOB CLAIM]                                                            |
|    └─ UPDATE execution_jobs SET status='running' WHERE id=:id AND status='queued' |
|                                                                                   |
|  [2. GITHUB_ANALYSIS]                                                             |
|    ├─ Static AST repository evidence collection                                   |
|    └─ Verify exact pinned commit SHA & deliverables                               |
|                                                                                   |
|  [3. SANDBOX_EXECUTION]                                                           |
|    ├─ Modal microVM container isolation                                           |
|    └─ Persist factual runtime logs & exit codes to public.runtime_evidences       |
|                                                                                   |
|  [4. AI_REVIEW (OpenRouter LLM)]                                                  |
|    ├─ Multi-signal code evaluation without mock fallbacks                         |
|    └─ Generates scores, criteria fulfillment, strengths & improvements            |
|                                                                                   |
|  [5. DETERMINISTIC VALIDATION]                                                    |
|    ├─ Anti-hallucination score adjustment & factual pass/fail alignment           |
|    └─ Persist review to public.internship_reviews                                 |
|                                                                                   |
|  [6. FINAL TRANSITION & PERSISTENCE]                                              |
|    ├─ Mark execution_jobs as 'completed'                                          |
|    ├─ Update internship_submissions status ('passed' or 'needs_revision')         |
|    └─ Update student_learning_states (scores, velocity, difficulty rec)           |
|                                                                                   |
|  [7. AUTOMATIC TASK 2 ON PASS]                                                    |
|    ├─ Mark enrollment_milestones completed                                        |
|    ├─ Pedagogical Decision Engine runs                                            |
|    ├─ OpenRouter generates Task 2 with 10 deterministic gates                     |
|    ├─ Persist Task 2 to public.internship_tasks                                   |
|    └─ Set student_learning_states.active_task_id = Task2.id                       |
+-----------------------------------------------------------------------------------+
```

---

## 2. STATE MACHINE & CONCURRENCY PROTECTION

### 2.1 Atomic Job Claiming

To prevent race conditions where multiple workers or concurrent retries process the same job:

```sql
UPDATE public.execution_jobs
SET status = 'running', started_at = timezone('utc'::text, now())
WHERE id = :job_id AND status = 'queued'
RETURNING id;
```

If 0 rows are updated, the job has already been claimed by another worker and execution immediately terminates.

### 2.2 Execution Job Status Lifecycle

| State | Description | Transition Trigger |
| :--- | :--- | :--- |
| `queued` | Initial state upon submission creation | `submitInternshipTaskAction` |
| `running` | Claimed by background worker | `claimExecutionJob()` |
| `completed` | Pipeline executed successfully | Final validation & review persisted |
| `failed` | Inaccessible repo or worker failure | Unrecoverable error |
| `timed_out` | Worker exceeded max execution timeout | `recoverStaleJobs()` |

---

## 3. IDEMPOTENCY & IMMUTABLE ATTEMPTS

1. **Immutable Attempts**: Submissions are constrained by `CONSTRAINT unique_task_attempt UNIQUE (task_id, attempt_number)`. Previous attempts (`Attempt 1`, `Attempt 2`) are never overwritten.
2. **Commit Idempotency**: If a student submits the exact same commit SHA for a task while a previous submission is still processing (`submitted`, `collecting_evidence`, `running_verification`, `in_review`), the action returns the existing submission ID without creating a duplicate job.
3. **Automatic Task 2 Generation**: Task 2 generation is triggered on the backend upon a passing verdict and persisted directly to `public.internship_tasks`. The client does not need to remain connected.

---

## 4. FAILURE RECOVERY & RETRY POLICY

1. **Transient AI Rate Limits (HTTP 429)**: Handled by OpenRouter backoff or returned as a retryable error.
2. **Stale Job Recovery**: `recoverStaleJobs(supabase, 5)` finds jobs in `running` status for longer than 5 minutes and marks them `timed_out`, releasing locks.
3. **Failure Isolation**: A failed attempt (e.g. invalid commit or network error) never corrupts previously passed attempts, completed milestones, or student learning states.

---

## 5. SERVER-AUTHORITATIVE STATUS READER

`getSubmissionStatusAction(submissionId)` enables the client UI to poll the factual database status without exposing internal prompts, API keys, or infrastructure credentials:

```typescript
const { submission, job, review } = await getSubmissionStatusAction(submissionId);
// Returns: { status: 'in_review', attemptNumber: 1, jobStatus: 'running', ... }
```
