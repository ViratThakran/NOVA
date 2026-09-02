import fs from "fs";
import path from "path";
import os from "os";

export interface ModalCredentials {
  tokenId?: string;
  tokenSecret?: string;
  source: "env" | "modal_toml" | "none";
}

/**
 * Resolves Modal credentials securely:
 * 1. Priority 1: MODAL_TOKEN_ID and MODAL_TOKEN_SECRET environment variables.
 * 2. Priority 2: Standard ~/.modal.toml configuration file created by official `modal token new` CLI.
 *
 * NEVER logs or exposes token values.
 */
export function resolveModalCredentials(): ModalCredentials {
  if (process.env.MODAL_TOKEN_ID && process.env.MODAL_TOKEN_SECRET) {
    return {
      tokenId: process.env.MODAL_TOKEN_ID,
      tokenSecret: process.env.MODAL_TOKEN_SECRET,
      source: "env",
    };
  }

  const modalTomlPath = path.join(os.homedir(), ".modal.toml");
  if (fs.existsSync(modalTomlPath)) {
    try {
      const content = fs.readFileSync(modalTomlPath, "utf-8");
      const idMatch = content.match(/token_id\s*=\s*["']([^"']+)["']/);
      const secretMatch = content.match(/token_secret\s*=\s*["']([^"']+)["']/);

      if (idMatch && secretMatch) {
        return {
          tokenId: idMatch[1],
          tokenSecret: secretMatch[1],
          source: "modal_toml",
        };
      }
    } catch {
      // Ignore reading errors silently to maintain security
    }
  }

  return { source: "none" };
}
