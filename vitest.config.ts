import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => ({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globals: true,
    env: loadEnv(mode, process.cwd(), ""),
  },
}));
