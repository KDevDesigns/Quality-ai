# QA Hub — project rules for Claude Code

**Current focus: the QA ticket hub.** 5 QA testers and the developers file and discuss ERP bugs, suggestions and
improvements here (marked-up screenshots, videos, a conversation per ticket, and a who's-who directory of module
owners) instead of Messenger. It runs on the office LAN behind login. Operations are in `docs/OPERATIONS.md`.

Behind an admin toggle sits the original **AI QA workbench** for testing our **in-house web ERP** (Billing & Collection,
Procurement & Inventory, Finance & Accounting, HR & Payroll) through its UI, API and read-only DB. It is paused for a
major revision. Both run on one Windows 11 laptop
(i5-9300H, 16 GB RAM, RTX 2060 6 GB, 256 GB SSD + 1 TB HDD). The full roadmap is in `docs/PLAN.md`.
Domain terms are in `docs/glossary.md` and role permissions in `docs/roles.md`.
Build **one phase at a time**, start in plan mode, and stop for review at the end of each phase.

## Stack (do not swap without asking)
- Next.js 16 App Router, React 19, TypeScript strict, Tailwind 4. No `src/` dir; code lives in `app/` and `lib/`.
- AI: Vercel AI SDK (`ai`). Cloud = `@ai-sdk/anthropic`. Local = Ollama through `@ai-sdk/openai-compatible`
  at `http://127.0.0.1:11434/v1`. Check the current docs before using any SDK API, since these packages change fast.
- Validation: `zod`. Use structured output (`generateObject`) for anything the UI parses.
- DB: Prisma + SQLite (`prisma/dev.db`). Avoid native modules that need Visual Studio build tools.
- Test execution: `@playwright/test`, run as a **child process** with the JSON reporter, never in the request thread.
- Package manager: npm.

## Hard rules
1. **Hybrid privacy routing.** Every LLM call goes through `lib/ai/router.ts`. Never import a provider directly in
   feature code. Data flagged `sensitive` (customer names, account numbers, addresses, billing amounts, credentials,
   raw DB rows, production logs) goes to the **local** model only, or through `lib/ai/redact.ts` before it goes to the cloud.
   Log every cloud call (task, model, tokens, redaction applied) to the `AuditLog` table.
2. **Never test production.** Targets come from the `Environment` table, which has an allowlist of base URLs.
   The runner and the explorer agent must refuse any URL outside the selected environment's allowlist.
3. Secrets live only in `.env.local` (git-ignored). Never hard-code or log them.
4. Long jobs (test runs, explorations) are queued. They save progress to the DB, and the UI polls or streams progress.
5. All server code that spawns processes or touches the filesystem uses the Node runtime (`export const runtime = "nodejs"`).
6. **Office LAN only, behind login.** The app serves the QA team and developers on the office network
   (`npm run build && npm run serve`), never the internet. Every page, Server Action and route handler checks the
   session through `lib/auth/session.ts` (`requireUser`, `requireAction`, `getCurrentUser`). `proxy.ts` is only an
   optimistic redirect. Permissions live in one matrix in `lib/auth/permissions.ts`.
7. Keep generated Playwright specs in `tests/generated/` and run artifacts (screenshots, traces) in `runs/<runId>/`.
   Both are git-ignored. AI-generated specs move into `tests/` only after human approval.
8. **Money is checked by code, not AI.** Amounts, quantities and balances are asserted with the oracles in
   `lib/oracles/` and the recon queries in `lib/recon/`. Use `decimal.js` and never floating point.
   Tariff, tax and contribution rates are data files and are never hard-coded.
9. ERP DB access is **read-only** (a dedicated staging user). Never write to the ERP DB directly. Create test data through
   the ERP UI or API with a `QA-` prefix.
10. The healer may change locators and waits only, never assertions or expected values.
11. The explorer agent's denylist (delete, post, approve, pay, close period) stays on unless the user enables an action for a session.
12. **Ticket data never goes to an LLM.** Ticket text, screenshots and videos show customer names, account numbers and
    amounts. A future AI feature on tickets must go through `lib/ai/router.ts` and use the local model only.
13. **Uploads live outside the repo** in `UPLOAD_DIR` (on the HDD). They are served only through an auth-checked route,
    never from `public/`, and stored under generated names, never the uploader's file name.
14. The AI workbench (`app/(main)/(ai)/`) is hidden unless an admin turns it on in Admin → Workspace. Its pages, actions
    and routes call `requireAiWorkbench()` / `aiWorkbenchAllowed()` from `lib/workspace.ts`.

## Model routing defaults
| Task | Model |
|---|---|
| Sensitive data, quick classification, redaction checks | local (`OLLAMA_MODEL`, a 7–8B coder model in Q4) |
| Test case generation from non-sensitive requirements | cloud `claude-sonnet-5-5` |
| Playwright/API test code generation, code review | cloud `claude-sonnet-5-5` |
| Exploratory agent (tool use, multi-step) | cloud `claude-sonnet-5-5`, with a step budget |
| Cheap bulk tasks (summaries, dedupe bugs) | cloud `claude-haiku-5-5` or local |

The user can override the model per task in Settings. If Ollama is down, show a clear error and **never** fall back
to the cloud for sensitive data.

## Conventions
- `lib/` holds framework-free logic (ai, auth, areas, tickets, runner, db, redact). `app/` holds UI and route handlers only.
- Route groups: `app/login` (no chrome), `app/(main)` (sidebar; tickets, team, admin), `app/(main)/(ai)` (AI workbench).
- With Cache Components on, read the session only inside a `<Suspense>` boundary. Put a page's header inside its guarded
  component when the whole page is role-restricted.
- Server Actions for form mutations. Route handlers for streaming and job endpoints.
- Write a Vitest unit test for every `lib/` module, especially `redact.ts` and the URL allowlist guard.
- Commands: `npm run dev`, `npm run lint`, `npx tsc --noEmit`, `npx vitest run`, `npx playwright test`,
  `npm run user:create -- --admin --name "…" --email …`, `npm run serve` (LAN), `npm run backup`.
  Before saying a phase is done, run lint, the type check and the tests.
