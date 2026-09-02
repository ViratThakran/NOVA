import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Unit tests, sandbox worker tests, & AI quality evaluation tests
    include: ["tests/unit/**/*.test.ts", "sandbox-worker/tests/**/*.test.ts", "tests/ai-evaluation/**/*.test.ts"],
    exclude: ["tests/integration/**"],
  },
});
