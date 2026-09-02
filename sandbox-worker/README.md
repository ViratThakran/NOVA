# NOVA Dedicated Sandbox Worker Service

**Subsystem:** Out-of-Process Runtime Verification Execution Plane  
**Version:** 1.0.0  
**Phase:** Phase 3H (Modal Cloud Sandbox Adapter Integration)  

---

## 1. Overview & Security Boundary

The Sandbox Worker is an isolated execution service responsible for verifying untrusted student code inside disposable execution sandboxes (e.g. Modal Cloud Containers or Mock Sandbox during local development/CI).

```text
NOVA CONTROL PLANE (Trusted)
        │
        │ HTTP POST /v1/execute (HMAC-SHA256 Signed)
        ▼
SANDBOX WORKER (Untrusted Execution Plane)
        │
        ├── 1. Verify HMAC-SHA256 Signature
        ├── 2. Validate Profile (node_typescript / python)
        ├── 3. Verify Pinned Commit SHA
        ├── 4. Ephemeral Modal Sandbox (CREATE -> PREPARE -> EXECUTE -> COLLECT -> DESTROY)
        │      (NETWORK = DENY, 512MB RAM, 1 vCPU, 16 PIDs, 60s, 64KB log cap)
        └── 5. Return Factual RuntimeEvidence
```

---

## 2. Local Development vs. Production Sandbox

> [!IMPORTANT]
> **Mock Runner ≠ Production Sandbox**
> - **Local Development & CI:** Runs with `SANDBOX_BACKEND=mock` (or `NOVA_SANDBOX_WORKER_URL` unset). This uses the deterministic in-memory adapter which guarantees zero host code execution on developer machines.
> - **Production Mode:** Runs with `SANDBOX_BACKEND=modal` and requires `MODAL_TOKEN_ID` and `MODAL_TOKEN_SECRET`.

---

## 3. Environment Variables

| Variable | Description | Default | Environment |
| :--- | :--- | :--- | :--- |
| `WORKER_PORT` | HTTP port for the worker daemon | `8080` | Local / Worker |
| `NOVA_WORKER_SECRET` | Shared secret for HMAC-SHA256 service-to-service authentication | Required in production | Control Plane / Worker |
| `SANDBOX_BACKEND` | Execution backend (`mock` or `modal`) | `mock` | Worker |
| `MODAL_TOKEN_ID` | Modal Cloud API Token ID | None | Worker (Modal mode) |
| `MODAL_TOKEN_SECRET` | Modal Cloud API Token Secret | None | Worker (Modal mode) |
| `MODAL_ENVIRONMENT` | Modal Environment Name | `main` | Worker (Modal mode) |
| `MODAL_APP_NAME` | Modal Application Namespace | `nova-internship-mentor` | Worker (Modal mode) |

---

## 4. Endpoints

### `GET /health`
Returns worker health status, backend name (`ModalSandboxBackend` or `MockSandboxBackend`), and supported execution profiles.

### `POST /v1/execute`
Executes an allowlisted test verification command against a pinned repository commit.

**Required Headers:**
- `X-Nova-Timestamp`: ISO 8601 UTC timestamp
- `X-Nova-Signature`: `sha256={hmac_hex_digest}`

**Payload:**
```json
{
  "execution_id": "job_123",
  "submission_id": "sub_456",
  "repository_url": "https://github.com/student/app",
  "commit_sha": "a1b2c3d4e5f67890abcdef1234567890abcdef12",
  "execution_profile": "node_typescript",
  "profile_version": "1.0",
  "limits": {
    "timeoutSeconds": 60,
    "maxMemoryMb": 512,
    "maxCpus": 1,
    "maxProcesses": 16,
    "maxOutputBytes": 65536,
    "network": "DENY"
  }
}
```

---

## 5. Security & Isolation Controls

1. **Hardware / Container Boundary:** Untrusted student code executes inside an isolated Modal container; the worker host never executes student scripts.
2. **Network Denial:** Configured with `block_network: true` (`NETWORK = DENY`). Egress to cloud metadata (`169.254.169.254`), Supabase (`127.0.0.1:54321`), and internet is blocked.
3. **Secret Isolation:** Worker strips all environment variables. Guest container receives only `PATH`, `NODE_ENV=test`, `HOME=/workspace`.
4. **Log Bounding:** Output streams are truncated at 65,536 bytes (64KB).
5. **Guaranteed Destruction:** Container is destroyed in a `finally` block even upon timeout or crash.
