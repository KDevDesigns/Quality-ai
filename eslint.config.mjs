import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "lib/generated/**",
  ]),
  {
    // CLAUDE.md hard rule #1: every LLM call goes through lib/ai (runTask), never a provider directly.
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}", "prisma/**/*.ts"],
    ignores: ["lib/ai/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [{ name: "ai", message: "Call runTask from @/lib/ai instead of the AI SDK directly." }],
          patterns: [
            { group: ["@ai-sdk/*", "ai/*"], message: "Call runTask from @/lib/ai instead of a provider directly." },
            { group: ["@/lib/ai/providers", "@/lib/ai/router"], message: "Use runTask from @/lib/ai; providers and the raw router are internal." },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
