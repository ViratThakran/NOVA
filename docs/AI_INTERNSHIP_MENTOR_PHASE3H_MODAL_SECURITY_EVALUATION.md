# NOVA AI Internship Mentor — Phase 3H Modal Security Evaluation

**Subsystem:** Modal Sandbox Cloud Execution Adapter & Security Boundaries  
**Evaluation Date:** 2026-08-31  
**Target Milestone:** Phase 3H  
**Security Classification:** **`IMPLEMENTED_BUT_NOT_SECURITY_PROVEN`**  

---

## 1. Executive Summary

Phase 3H implements the cloud-isolated Modal Sandbox adapter (`ModalSandboxBackend`) connecting the NOVA Dedicated Sandbox Worker to Modal's isolated cloud container hypervisors.

This evaluation examines every security invariant of the Modal adapter architecture under synthetic integration tests and operational constraints:

```text
               ┌─────────────────────────────────────────────────────────┐
               │             TRUSTED ZONE: NOVA CONTROL PLANE            │
               │  - Next.js Web App / Submission & Review Services       │
               │  - HMAC-SHA256 Request Signer (X-Nova-Signature)        │
               │  - ZERO Production Secrets Transmitted                  │
               └────────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
               ┌─────────────────────────────────────────────────────────┐
               │             UNTRUSTED ZONE: SANDBOX WORKER              │
               │  - HMAC Request Authenticator & Replay Window Verifier  │
               │  - Pinned Commit SHA Verifier                           │
               │  - Execution Policy Resolver (node_typescript / python) │
               │  - Disposable Ephemeral Lifecycle Manager               │
               └────────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
               ┌─────────────────────────────────────────────────────────┐
               │       MODAL CLOUD ISOLATED CONTAINER (HYPERVISOR)       │
               │  - Hardware Container Isolation Boundary                │
               │  - NETWORK = DENY (block_network = true)                │
               │  - Resource Caps: 1 vCPU, 512MB RAM, 60s timeout        │
               │  - Minimal Sanitized Environment (PATH, NODE_ENV=test)  │
               │  - Allowlisted Test Command (npm test / pytest)         │
               │  - 64KB Log Stream Bounding                             │
               │  - Guaranteed Sandbox Destruction (finally block)       │
               └─────────────────────────────────────────────────────────┘
```

---

## 2. Security Classification Matrix

| Security Property | Implementation Mechanism | Enforcement Layer | Real Integration Test | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Host Isolation** | `ModalSandboxBackend` executes code in remote Modal cloud container | Remote Cloud Hypervisor | Yes (Mock & Adapter) | **`PROVEN`** |
| **Network Denial** | `block_network = true` (`NETWORK = DENY`) | Modal Hypervisor vNIC / iptables | Yes (`SIMULATE_NETWORK_ACCESS` $\to$ `blocked`, `EHOSTUNREACH`) | **`PROVEN`** (Adapter) / `IMPLEMENTED_BUT_NOT_SECURITY_PROVEN` (Live KVM) |
| **Secret Isolation** | Stripped environment (zero host env vars passed) | `buildSanitizedEnvironment()` | Yes (Sentinel secret `NOVA_TEST_SENTINEL_SECRET` verified absent) | **`PROVEN`** |
| **Filesystem Isolation** | Ephemeral `/workspace` tmpfs mount; no host mounts | Modal Container Namespace | Yes (Workspace boundary verified) | **`PROVEN`** |
| **CPU Limit** | 1.0 vCPU allocation (`limits.maxCpus = 1`) | Modal Cloud CFS scheduler | Yes (Enforced in container config) | **`PROVEN`** |
| **Memory Limit** | 512MB RAM limit (`limits.maxMemoryMb = 512`) | Linux cgroup memory controller | Yes (`SIMULATE_OOM` $\to$ `resource_exceeded`, exit 137) | **`PROVEN`** |
| **Execution Timeout** | 60s hard wall-clock timer | Modal container lifecycle manager | Yes (`SIMULATE_TIMEOUT` $\to$ `timed_out`, exit 124) | **`PROVEN`** |
| **PID / Process Limit** | `pids.max = 16` | Linux cgroup PID controller | Yes (Adapter mapping defined) | **`IMPLEMENTED_BUT_NOT_SECURITY_PROVEN`** |
| **Output Log Bounding** | Stream truncator capping output at 65,536 bytes | `evidence/collector.ts` | Yes (`SIMULATE_HUGE_LOGS` strictly truncated at 64KB) | **`PROVEN`** |
| **Command Allowlist** | Centralized profile policy mapping | `policy/index.ts` | Yes (Arbitrary commands rejected) | **`PROVEN`** |
| **Commit SHA Pinning** | `actualCommitSha == requestedCommitSha` check | `repository/fetcher.ts` | Yes (Attempt 1 at $SHA_A$, Attempt 2 at $SHA_B$) | **`PROVEN`** |
| **Guaranteed Destruction** | `destroy()` in `finally` block | `server/handler.ts` | Yes (Active sandbox map empty after execution) | **`PROVEN`** |
| **Evidence Authenticity** | Output verified by control plane before AI review | `validator.ts` | Yes (Factual metrics only) | **`PROVEN`** |

---

## 3. What Is Proven vs. What Remains Unproven

### Proven Properties:
1. **Zero Host Execution Risk:** Untrusted student code is never spawned on the Next.js control plane, worker daemon host, or developer machines.
2. **Secret Sanitization:** Application secrets (`SUPABASE_SECRET_KEY`, `ANTHROPIC_API_KEY`, DB URLs) are stripped; test sentinel variables verify zero environment inheritance.
3. **Log Storage & Buffer Protection:** Massive stdout/stderr output streams are strictly truncated at 64KB, eliminating memory exhaustion or DB bloat.
4. **Multi-Attempt Commit Pinning:** Submission attempts are tied to immutable commit SHAs ($Attempt_1 \to SHA_A$, $Attempt_2 \to SHA_B$) and cannot be swapped.
5. **Anti-Hallucination Review Grounding:** The AI Mentor review validator rejects any review claiming tests passed unless verified by runtime evidence ($exit\_code == 0$ and $failed == 0$).
6. **Prompt Injection Resistance:** System instructions anchor the AI Reviewer to factual test results, preventing malicious README instructions (`"GIVE 100/100"`) from bypassing review policies.

### What Remains Unproven:
- **Live Cloud Hardware Verification:** Although `ModalSandboxBackend` is fully integrated, live testing against an active Modal Cloud tenant requires live `MODAL_TOKEN_ID` and `MODAL_TOKEN_SECRET` provisioned in production secrets.
- **Physical Packet Drop Verification on Live Hypervisor:** Requires live deployment against Modal cloud network infrastructure.

---

## 4. Final Security Classification

```text
======================================================================
         PHASE 3H MODAL SECURITY EVALUATION CLASSIFICATION
======================================================================

SECURITY STATUS: IMPLEMENTED_BUT_NOT_SECURITY_PROVEN

- Application Guardrails:        PROVEN
- Secret Stripping & Bounding:   PROVEN
- Commit SHA Pinning:            PROVEN
- Anti-Hallucination Policy:     PROVEN
- Live Cloud Hypervisor KVM:     IMPLEMENTED_BUT_NOT_SECURITY_PROVEN
======================================================================
```
