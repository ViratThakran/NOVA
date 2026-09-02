import { describe, it, expect } from "vitest";
import http from "http";

describe("Network Denial Verification Fixture", () => {
  it("attempts connection to AWS/GCP cloud metadata endpoint (169.254.169.254)", async () => {
    const reachable = await new Promise<boolean>((resolve) => {
      const req = http.get("http://169.254.169.254/latest/meta-data/", { timeout: 1000 }, () => {
        resolve(true);
      });
      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
    });

    // Cloud metadata MUST be unreachable
    expect(reachable).toBe(false);
  });

  it("attempts connection to local Supabase / localhost port 54321", async () => {
    const reachable = await new Promise<boolean>((resolve) => {
      const req = http.get("http://127.0.0.1:54321/health", { timeout: 1000 }, () => {
        resolve(true);
      });
      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
    });

    // Localhost / internal services MUST be unreachable from guest container
    expect(reachable).toBe(false);
  });
});
