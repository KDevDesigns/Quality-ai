import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    // Each DB test file boots its own PGlite and replays every migration; in parallel that can pass 10 s.
    hookTimeout: 60_000,
  },
});
