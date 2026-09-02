import sys
import os
import json
import time
import re
import traceback

# Force UTF-8 stdout encoding on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

def parse_test_summary(stdout: str, stderr: str, exit_code: int):
    combined = stdout + "\n" + stderr
    total = 0
    passed = 0
    failed = 0
    skipped = 0

    # Vitest / Jest pattern 1: Tests: 2 passed, 2 total
    m = re.search(r"Tests\s*:\s*(?:(\d+)\s*failed,?\s*)?(?:(\d+)\s*passed,?\s*)?(?:(\d+)\s*skipped,?\s*)?(\d+)\s*total", combined, re.IGNORECASE)
    if m:
        failed = int(m.group(1) or 0)
        passed = int(m.group(2) or 0)
        skipped = int(m.group(3) or 0)
        total = int(m.group(4) or 0)
        return {"total": total, "passed": passed, "failed": failed, "skipped": skipped}

    # Vitest pattern 2: ✓ 2 passed (2)
    m2 = re.search(r"(\d+)\s*passed", combined, re.IGNORECASE)
    if m2:
        passed = int(m2.group(1))
    m3 = re.search(r"(\d+)\s*failed", combined, re.IGNORECASE)
    if m3:
        failed = int(m3.group(1))
    m4 = re.search(r"(\d+)\s*skipped", combined, re.IGNORECASE)
    if m4:
        skipped = int(m4.group(1))

    total = passed + failed + skipped
    if total == 0:
        if exit_code == 0:
            total = 1
            passed = 1
        else:
            total = 1
            failed = 1

    return {"total": total, "passed": passed, "failed": failed, "skipped": skipped}

def extract_runtime_nonce(stdout: str) -> str:
    m = re.search(r"\[RUNTIME_NONCE:([a-zA-Z0-9-]+)\]", stdout)
    return m.group(1) if m else ""

def main():
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            print(json.dumps({"error": "Empty input payload"}), file=sys.stderr)
            sys.exit(1)

        payload = json.loads(raw_input)
        repo_path = payload.get("repo_path")
        command = payload.get("command", ["vitest", "run"])
        profile = payload.get("profile", "node_typescript")
        raw_timeout = payload.get("timeout", 60)
        timeout = max(10, int(raw_timeout))
        memory_mb = payload.get("memory_mb", 512)
        cpu = payload.get("cpu", 1.0)
        block_network = payload.get("block_network", True)
        env = payload.get("env", {})
        app_name = payload.get("app_name", "nova-internship-mentor")

        import modal

        app = modal.App.lookup(app_name, create_if_missing=True)

        if profile == "python":
            base_image = modal.Image.debian_slim().pip_install("pytest", "pytest-json-report", "flake8", "ruff")
        else:
            base_image = (
                modal.Image.debian_slim()
                .apt_install("curl")
                .run_commands(
                    "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -",
                    "apt-get install -y nodejs",
                    "npm install -g vitest@2.0.5 typescript"
                )
            )

        if repo_path and os.path.exists(repo_path):
            image = base_image.add_local_dir(os.path.abspath(repo_path), remote_path="/workspace")
        else:
            image = base_image

        t0 = time.time()
        sb = modal.Sandbox.create(
            *command,
            app=app,
            image=image,
            workdir="/workspace",
            timeout=timeout,
            memory=memory_mb,
            cpu=cpu,
            block_network=block_network,
            env=env,
        )
        create_duration_ms = int((time.time() - t0) * 1000)
        sandbox_id = sb.object_id

        t_exec_start = time.time()
        try:
            sb.wait()
            exec_duration_ms = int((time.time() - t_exec_start) * 1000)
        except Exception as wait_err:
            exec_duration_ms = int((time.time() - t_exec_start) * 1000)

        stdout = sb.stdout.read()
        stderr = sb.stderr.read()
        exit_code = sb.returncode

        try:
            sb.terminate()
        except Exception:
            pass

        # Check for timeout or failure status
        status = "completed"
        if exit_code is None or exit_code == 124 or "timeout" in stderr.lower():
            status = "timed_out"
            if exit_code is None:
                exit_code = 124
        elif exit_code != 0:
            status = "failed"

        tests_summary = parse_test_summary(stdout, stderr, exit_code)
        runtime_nonce = extract_runtime_nonce(stdout)

        result = {
            "sandbox_id": sandbox_id,
            "status": status,
            "exit_code": exit_code,
            "create_duration_ms": create_duration_ms,
            "exec_duration_ms": exec_duration_ms,
            "total_duration_ms": create_duration_ms + exec_duration_ms,
            "stdout": stdout,
            "stderr": stderr,
            "tests": tests_summary,
            "runtime_nonce": runtime_nonce,
        }

        out_json = json.dumps(result, ensure_ascii=False)
        sys.stdout.buffer.write(out_json.encode("utf-8"))
        sys.stdout.buffer.flush()

    except Exception as e:
        err_msg = f"{str(e)}\n{traceback.format_exc()}"
        err_json = json.dumps({
            "error": str(e),
            "traceback": err_msg,
            "status": "verification_unavailable",
            "exit_code": 1
        }, ensure_ascii=False)
        sys.stdout.buffer.write(err_json.encode("utf-8"))
        sys.stdout.buffer.flush()
        sys.exit(1)

if __name__ == "__main__":
    main()
