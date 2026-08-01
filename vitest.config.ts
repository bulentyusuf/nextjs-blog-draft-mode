import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
  test: {
    // Node stays the default: the lib suite is pure functions and runs in
    // under a second, and jsdom would tax every one of them for the benefit
    // of a handful of component tests. Those opt in per file with a
    // `@vitest-environment jsdom` docblock.
    environment: "node",
    include: ["lib/**/*.test.{ts,tsx}", "app/**/*.test.{ts,tsx}"],
  },
});
