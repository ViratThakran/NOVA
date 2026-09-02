# Architecture Decision Record (ADR) — Phase 3: Runtime Execution & Sandbox Isolation

**Status:** Approved  
**Decision Date:** 2026-08-31  
**Decision Drivers:** Security Isolation, Zero Production Secret Leakage, Denial of Service Resistance, Deterministic Test Evidence, Low Latency, and Cloud Compatibility.

---

## 1. Context & Problem Statement

NOVA requires automated, factual verification of untrusted student code submissions across multiple tracks (Node.js/TypeScript, Python). The execution environment must run student-provided test suites and source code to extract structured runtime evidence (`tests_summary`, `build_summary`, `exit_code`, `duration_ms`) while guaranteeing that:
1. Untrusted student code can NEVER compromise the host operating system, web servers, or sibling student data.
2. Untrusted student code can NEVER access production credentials (`SUPABASE_SECRET_KEY`, `ANTHROPIC_API_KEY`, GitHub PATs).
3. Untrusted student code can NEVER make unrestricted outbound network calls (`NETWORK = DENY`).
4. Resource exhaustion (infinite loops, memory bombs, fork bombs, log flooding) is strictly contained.

---

## 2. Evaluation of Execution Architectures

| Architecture Option | Kernel & OS Isolation | Network & Secret Security | Resource & Process Limits | Cold Start Latency | Operational Complexity | Local Dev Viability | Production Suitability | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A. Host Subprocess (`child_process.exec` / `spawn`)** | **None (Fails).** Shared process memory, full host kernel exposure. | **Fails.** Inherits `process.env` and host network by default. | Weak (OS signals only; vulnerable to fork bombs). | < 10 ms | Lowest | Dangerous | **REJECTED (Catastrophic Risk)** |
| **B. Shared Docker on Web Server (`/var/run/docker.sock`)** | Moderate (Linux namespaces & cgroups). Shared host kernel. | Moderate. Requires manual `iptables` and env stripping. | Good via cgroup flags (`--memory`, `--cpus`, `--pids-limit`). | 500 – 1,500 ms | High (Requires root/docker daemon on web server; fails in serverless). | Good | **REJECTED (Docker socket privilege escalation risk & serverless incompatibility)** |
| **C. gVisor (`runsc` Container Runtime)** | **High.** Intercepts all syscalls via user-space kernel emulator (Sentry). | **High.** Virtualized network stack; zero host kernel access. | Strong cgroups v2 integration. | 100 – 300 ms | Moderate (Requires host kernel with virtualization support). | Moderate (Linux only) | **VIABLE for dedicated Linux worker pools.** |
| **D. Firecracker MicroVMs (Hardware KVM)** | **Maximum (Gold Standard).** Separate guest Linux kernel per microVM; hardware-assisted KVM isolation. | **Maximum.** No guest network device attached (`veth=none`); zero secret injection. | Hardware-enforced guest memory, vCPU, and process boundaries. | 5 – 20 ms | High (Requires bare-metal or nested KVM cloud instances). | Requires Linux/KVM | **RECOMMENDED BARE-METAL PRODUCTION ENGINE** |
| **E. Managed Ephemeral Sandbox Service (e.g. E2B / Modal / Ephemeral Isolated Cloud Workers)** | **Maximum.** Out-of-process dedicated microVM clusters with hardware isolation. | **Maximum.** Web application communicates via authenticated job queue; runner runs in isolated sandboxes. | Built-in per-sandbox memory, CPU, timeout, and network policies. | 50 – 200 ms | Lowest for core platform team (Out-of-band execution). | Excellent (Pluggable interface with local Mock runner) | **RECOMMENDED MANAGED PRODUCTION ARCHITECTURE** |
| **F. Serverless Containers (Cloud Run / AWS Lambda with single-job lifecycle)** | **High.** Ephemeral container runtime destroyed after single execution. | **High.** VPC egress blocked via security groups; no secret variables passed. | Container memory & timeout enforced by cloud hypervisor. | 200 – 800 ms | Low (Serverless pay-per-execution). | Moderate | **VIABLE ALTERNATIVE for Cloud-native deployments** |

---

## 3. Chosen Decision & Architecture

### Dual-Layer Pluggable Runner Architecture:

```text
                     NOVA APPLICATION (Next.js)
                                 │
                                 ▼
                     Execution Job Persistence
                     (Immutable Commit SHA Pinned)
                                 │
                                 ▼
                    Execution Queue & Dispatcher
                                 │
         ┌───────────────────────┴───────────────────────┐
         │ (Production Engine)                           │ (Local Dev / CI / Testing)
         ▼                                               ▼
Ephemeral Sandbox Service                       Deterministic Mock Runner
(Firecracker MicroVM / E2B / Cloud Worker)      (Synthetic Fixtures & AST Verification)
  ├── Single-use disposable environment           ├── Zero host command execution
  ├── Network Policy: NETWORK = DENY              ├── Fast sub-millisecond unit tests
  ├── Zero Production Secrets                     ├── Validates data structures & schemas
  ├── Resource Caps: 512MB RAM, 1 vCPU, 60s       └── Tests anti-hallucination guardrails
  ├── Output Bounded: 64KB log cap
  └── Structured Reporter (Exit Code, Tests JSON)
         │                                               │
         └───────────────────────┬───────────────────────┘
                                 │
                                 ▼
                       Runtime Evidence Model
                    (Fact-based test pass/fails)
                                 │
                                 ▼
                   Multi-Signal AI Mentor Review
```

### Key Architectural Choices:
1. **Out-of-Process Execution Boundary:** The Next.js web application **NEVER** executes untrusted student code directly on the host machine.
2. **Immutable Commit Pinning:** Every execution job resolves and pins the student's exact Git commit SHA (`commit_sha`). Static evidence, test execution, and AI reviews are tied to the identical immutable snapshot across all attempts.
3. **Allowlisted Verification Profiles:** Students cannot specify arbitrary shell commands (`curl`, `wget`, `bash`, `rm`, `sudo`). Commands are strictly derived by NOVA from project type allowlists:
   - `node_typescript`: `npm test -- --runInBand --ci`
   - `python`: `pytest -v --tb=short`
4. **Zero Production Secret Leakage:** Execution workers run in a sanitized environment with zero application credentials, database keys, or API tokens passed to the guest.
5. **Disposable Single-Use Lifespan:** Every sandbox instance is created for exactly one execution job and permanently destroyed immediately after log collection.

---

## 4. Consequences & Trade-offs

### Positive:
- Complete elimination of host compromise, secret leakage, and serverless crash risks.
- Factual grounding for AI reviews: the reviewer only cites runtime test passes if corroborated by runner output.
- Clean separation between local developer experience (deterministic fast testing) and production cloud sandboxes.

### Negative / Explicit Limitations:
- Running full isolated MicroVMs in production introduces cloud execution costs (e.g. ~$0.0001 per test run) and a 1–5 second queuing latency compared to static-only review.
- Language support is intentionally constrained to allowlisted profiles (`node_typescript`, `python`) during Phase 3; unsupported project types safely route to `manual_review`.
