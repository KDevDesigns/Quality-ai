# QA AI for In-House ERP — Complete Build Plan

> **How to use this file:** Claude Code reads `CLAUDE.md` automatically. Point it at this plan **one phase at a time**
> (see §12). Every phase ends with a "Done when" check. Do not start the next phase until it passes and is committed.

---

## 1. Goal

Build a local-first, AI-assisted QA workbench (Next.js) that tests the company's **in-house web ERP**:

| Module | Main business process to protect |
|---|---|
| Billing & Collection | **Meter-to-Cash**: customer → meter reading → bill run → payment → GL posting |
| Procurement & Inventory | **Procure-to-Pay**: purchase request → approval → PO → receiving → 3-way match → voucher → payment |
| Finance & Accounting | **Record-to-Report**: journals → postings → period close → trial balance and reports |
| HR & Payroll | **Hire-to-Retire / Time-to-Pay**: employee → attendance/leave → payroll → deductions → payslip → GL |

The workbench must be able to:
1. **Design tests:** turn requirements into test cases using standard techniques, with traceability.
2. **Automate tests:** generate and run Playwright UI and API tests and **business-process end-to-end suites**.
3. **Verify correctness:** check financial results with **deterministic oracles** (calculators and reconciliation queries), not AI opinion.
4. **Explore:** run an AI agent that clicks through staging and reports suspected bugs.
5. **Review:** analyze code diffs, logs and bug reports, and **select the regression tests** affected by a change.
6. **Report:** produce a release quality gate and an evidence pack that's useful for internal audit and COA.

---

## 2. What the research says (and how this plan applies it)

| Finding | Applied as |
|---|---|
| ERP failures happen **between** modules. Every screen can pass while the full process fails, e.g. a tax or rounding mismatch that breaks a downstream match. Coverage should be measured **by business journey, not screen count**. | Phase 6: process suites (Meter-to-Cash, P2P, R2R, Payroll) with ledger assertions at each hand-off. The dashboard shows coverage per process. |
| **Regression testing is the safety net** after changes and configuration updates. Prioritize critical finance cycles, high-volume transactions and areas linked to the change. | Phase 7: change-impact test selection plus a tagged regression suite (`@smoke`, `@critical`, `@regression`). |
| **Risk-based testing** that uses ISO/IEC 25010 quality characteristics as a checklist finds more defects than unguided effort. | Phase 1: risk register per module (likelihood × impact × characteristic) that drives test priority. |
| Test data must be **masked and referentially intact**, or test postings fail on missing master data. | Phase 4: deterministic seed fixtures and a masking utility. Production data never leaves staging unmasked. |
| AI adoption is high but maturity is low: most teams are still experimenting, and only a few have scaled AI-driven QA. Self-healing is being re-evaluated, because a "healed" test can hide a real bug. | AI **proposes** and a human **approves**. The healer never changes assertions. Healed tests are flagged for review. |
| LLM-generated oracles can be useful, but they are not a source of truth. | Money, quantities and balances are always checked by **code** (tariff calculator, debit = credit, subledger = GL). The AI only drafts. |
| Playwright now ships AI test agents (**planner, generator, healer**) on top of the Playwright MCP server, and they work with Claude Code. | Use them in **Claude Code while developing tests** (§12.3). The in-app runner stays plain Playwright, so runs are deterministic and repeatable. |
| COA findings on utility billing focus on **internal controls**: unreliable statements of account, under- or over-collection. Tariffs must follow the approved (LWUA-reviewed) rates. RA 10173 protects customer data on bills. | Phase 9 controls suite: segregation of duties, approval enforcement, audit trail, tariff-table verification, OR-number integrity, plus privacy rules in §3. |

Sources are listed in §14. Several are vendor blogs, so treat them as directional.

---

## 3. Non-negotiable rules (also in CLAUDE.md)

1. **Never test production.** Every target URL and DB connection is checked against the selected `Environment` allowlist. `isProduction=true` environments cannot be selected for runs.
2. **Hybrid privacy routing.** All LLM calls go through `lib/ai/router.ts`. Sensitive data (customer/employee names, account and meter numbers, addresses, amounts tied to a person, payroll, credentials, raw DB rows, logs) goes **local only**, or is **redacted** before any cloud call. Every cloud call is written to `AuditLog`.
3. **Deterministic oracles for money.** The AI never decides on its own whether an amount, quantity or balance is correct.
4. **Human approval** before the app saves AI-generated test code, healer patches or bug reports as final.
5. **Read-only DB access** for verification queries (a dedicated read-only DB user on staging).
6. Use `decimal.js` for all money math in oracles. No floating point. Round to centavos per the ERP's documented rule.
7. Secrets go in `.env.local` only. The app runs on the office LAN behind login (Phase 3.5), never the internet.

---

## 4. Feasibility on this laptop

| Resource | Reality | Mitigation |
|---|---|---|
| RTX 2060 6 GB | Runs 7–8B Q4 models well. Good for redaction, classification, summarizing logs. Weak at writing reliable test code or multi-step browsing. | Code generation and exploration go to Claude. Local handles privacy tasks. |
| 16 GB RAM | Ollama, Next dev, Chromium, VS Code and Claude Code together use about 12–14 GB. | One exploration at a time. Set `OLLAMA_KEEP_ALIVE=5m`. Playwright `workers: 2`. |
| 256 GB SSD | Models are about 5 GB each. | Set `OLLAMA_MODELS=D:\ollama\models` on the HDD. |
| i5-9300H (4 cores) | Big parallel suites are slow. | Tag-based selection. Run full regression overnight with a scheduled script. |
| Cloud cost | Agents use a lot of tokens. | Step budgets, Haiku for bulk work, token dashboard, monthly cap in Settings. |

**Verdict:** the plan is feasible as a single-user workbench. It isn't a team-wide server. If it later needs to be shared, move it to an internal server with authentication (out of scope for now).

---

## 5. Architecture

```
quality-ai/
├─ app/
│  ├─ (dashboard)/page.tsx          → quality overview: coverage by process, last runs, open defects, gate status
│  ├─ projects/  environments/      → targets, allowlists, credentials references (names only)
│  ├─ processes/                    → business-process library (Meter-to-Cash, P2P, R2R, Payroll) and steps
│  ├─ risks/                        → risk register (ISO 25010 characteristic, L×I score)
│  ├─ requirements/  testcases/     → design, edit, trace, export
│  ├─ data/                         → fixtures, oracles, reconciliation checks
│  ├─ runs/[id]/                    → live progress, results, screenshots, traces
│  ├─ explore/                      → agent sessions and findings
│  ├─ review/                       → diff/log/bug review and impact selection
│  ├─ defects/                      → bug drafts → confirmed defects
│  ├─ reports/                      → quality gate, evidence pack (PDF/XLSX)
│  ├─ settings/                     → models, budgets, provider health, audit log
│  └─ api/                          → route handlers (jobs, streaming)
├─ lib/
│  ├─ ai/        router.ts  redact.ts  prompts/*.ts  schemas/*.ts
│  ├─ guard/     allowlist.ts
│  ├─ runner/    queue.ts  playwright.ts  report-parser.ts
│  ├─ explorer/  agent.ts  tools.ts
│  ├─ oracles/   tariff.ts  payroll.ts  ledger.ts  inventory.ts
│  ├─ recon/     queries/*.sql  run-checks.ts      (read-only DB checks)
│  ├─ impact/    map-diff-to-modules.ts  select-tests.ts
│  ├─ reports/   gate.ts  evidence-pack.ts
│  └─ db.ts
├─ prisma/schema.prisma
├─ tests/
│  ├─ fixtures/      (auth storage states per role, seed data builders)
│  ├─ pages/         (Page Object Models per ERP screen)
│  ├─ api/           (API tests)
│  ├─ processes/     (end-to-end business-process suites)
│  ├─ generated/     (AI-generated specs awaiting review, git-ignored)
│  └─ unit/          (Vitest for lib/)
├─ runs/<runId>/     (artifacts, git-ignored)
└─ playwright.config.ts
```

### Tech choices
Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind 4 · shadcn/ui · Prisma + SQLite · zod · Vercel AI SDK (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai-compatible` for Ollama) · `@playwright/test` · `@axe-core/playwright` · Vitest · decimal.js · exceljs · a DB driver for the ERP's database (read-only; confirm whether it's MySQL, PostgreSQL or SQL Server in Phase 0) · optional k6 and OWASP ZAP.

### Data model (Prisma, initial)
```
Project, Environment(name, baseUrls Json, apiBaseUrl, dbConnRef, isProduction)
Module(name: BILLING|P2P|FINANCE|HR)
BusinessProcess(moduleId, name, steps Json)          -- e.g. Meter-to-Cash
Risk(moduleId, processId?, title, characteristic, likelihood 1-5, impact 1-5, score, mitigation)
Requirement(source, text, sensitive Boolean)
TestCase(requirementId?, processId?, title, technique, preconditions, steps Json, expected, priority P1-P4,
         type UI|API|PROCESS|RECON|NFR, tags String[], status DRAFT|APPROVED|AUTOMATED|OBSOLETE, aiGenerated)
TestScript(testCaseId, path, reviewedBy?, reviewedAt?)
TestRun(envId, trigger MANUAL|IMPACT|SCHEDULED, selection Json, status, startedAt, finishedAt, summary Json)
TestResult(runId, testCaseId, status PASS|FAIL|SKIP|FLAKY, durationMs, error, artifacts Json)
ReconCheck(name, sql, expectation) ; ReconResult(runId, checkId, status, detail)
Exploration(envId, goal, role, stepBudget, status, transcript Json) ; Finding(...)
Defect(title, severity S1-S4, module, processId, repro, evidence Json, status, linkedTestCaseIds)
Review(kind DIFF|LOG|BUG, input, output Json, impactedModules)
AuditLog(at, task, provider, model, tokensIn, tokensOut, redacted Boolean, sensitive Boolean)
```

---

## 6. Test strategy for the ERP

### 6.1 Test levels and where they live
| Level | What | Tool | Folder |
|---|---|---|---|
| API | Business rules at service level: fast and stable | Playwright `request` | `tests/api/` |
| UI component flows | Single screens, validations, RBAC visibility | Playwright + POM | `tests/pages/` + specs |
| **Business process E2E** | Full journeys across modules with ledger assertions | Playwright + recon queries | `tests/processes/` |
| Reconciliation | Data invariants after runs | SQL (read-only) | `lib/recon/queries/` |
| Non-functional | Accessibility, basic security, performance of batch jobs | axe, ZAP baseline, k6 | Phase 10 |

Aim for a **pyramid**: many API tests, a moderate number of UI tests, a few long process suites.

### 6.2 Test design techniques (the generator must label each case)
Equivalence partitioning · boundary value analysis · decision tables (approval and discount rules) · state transitions
(bill, PO and payroll statuses) · negative/abuse cases · role-based (each role × each action) · data-driven (tariff and tax tables).

### 6.3 Tags
`@smoke` (under 5 min, every build) · `@critical` (money and approvals) · `@regression` (full) · `@process:<name>` · `@module:<name>` · `@role:<role>`

### 6.4 Seed scenario catalog (starting backlog; the AI expands it)

**Billing & Collection (Meter-to-Cash)**
- Reading validation: current < previous (reject, or meter replacement/rollover handling), zero consumption, abnormal-high flag (e.g. > N× average), missing reading → estimated bill per policy.
- Tariff: each customer class × each consumption tier boundary (exactly at, ±1 m³), minimum charge, fixed charges, discounts per approved policy (e.g. senior citizen if applicable), compare to the **tariff oracle**.
- Bill run per zone/route: count of bills = active billable accounts, no duplicates, totals = sum of lines.
- Penalties: due date ±1 day, holidays/weekends per policy, waiver requires approval.
- Payments: full, partial, overpayment/advance, multiple bills, payment reversal (needs approval), duplicate-payment prevention, **OR number** sequence unique and gap-free per collector/series.
- Adjustments and credit memos need an approver ≠ preparer. Each creates an audit-trail entry.
- Disconnection/reconnection lifecycle states and fees.
- Posting: daily collection report = sum of ORs = cash/bank deposit = GL cash and AR entries.

**Procurement & Inventory (P2P)**
- Purchase request → approval chain by amount threshold (decision table) → PO, with a budget availability check before the PO is issued.
- Procurement rules per the company's procurement process (e.g. RA 12009 / BAC thresholds; confirm with the procurement office).
- Partial receiving, over-receiving blocked, inspection/acceptance, returns.
- **3-way match** (PO × receipt × invoice) with tolerance rules. Payment only after approval.
- Inventory: stock in/out, no negative stock, valuation method (e.g. moving average) checked against `inventory.ts`, reorder point alerts, issuance to job orders.

**Finance & Accounting (R2R)**
- Every posting is balanced (debits = credits, to the centavo).
- Subledger = GL control (AR, AP, inventory, payroll payable).
- Closed periods reject postings. Reversing entries are linked to the originals.
- Trial balance and financial statements tie to the GL. Report exports (PDF/XLSX) match on-screen totals.
- Chart of accounts changes: inactive accounts blocked from new entries.

**HR & Payroll**
- Attendance → payable days and hours. Leave balances, accrual and over-use blocked.
- Gross-to-net checked against `payroll.ts` using **current contribution and tax tables kept as data files** maintained by HR/accounting (GSIS, PhilHealth, Pag-IBIG, withholding tax; never hard-code the rates).
- Payroll approval workflow, re-run and adjustment controls, payslip privacy (an employee sees only their own payslip).
- Payroll → GL entries balanced.

**Cross-cutting (every module)**
- RBAC matrix: each role × each action (allowed and denied, through the UI **and** the API directly).
- Segregation of duties: the same user can't both prepare and approve.
- Audit trail: who, when, before → after on every financial change.
- Concurrency: two users editing or paying the same record.
- Money rounding, negative amounts, very large amounts, Filipino names with ñ and other special characters, date and period boundaries, session timeout.

### 6.5 Deterministic oracles (`lib/oracles/`)
- `tariff.ts`: `(class, consumption, date, discounts) → expected bill lines` from `data/tariffs/<effective-date>.json` (the approved schedule).
- `payroll.ts`: `(employee inputs, tables) → expected gross, deductions, net`.
- `ledger.ts`: balance checks and expected journal lines for each transaction type.
- `inventory.ts`: expected quantity and valuation after a sequence of movements.

The oracles are unit-tested with hand-worked examples **signed off by accounting or billing staff**. That sign-off is the trust anchor.

---

## 7. AI design

### 7.1 Model routing
| Task | Sensitive? | Model |
|---|---|---|
| Redaction check, classify log lines, summarize payroll/billing data | yes | local Ollama 7–8B |
| Test case generation from requirements | no / redacted | `claude-sonnet-5-5` |
| Playwright/API code generation, healer proposals | no | `claude-sonnet-5-5` |
| Code diff review and impact analysis | no (code) | `claude-sonnet-5-5` |
| Exploratory agent | test data only | `claude-sonnet-5-5`, step budget |
| Dedupe and summarize findings, bulk tagging | depends | `claude-haiku-5-5` or local |

If Ollama is down, sensitive tasks **fail with a clear message**. They never fall back to the cloud.

### 7.2 Structured outputs (zod, in `lib/ai/schemas/`)
`TestCaseDraft`, `RiskDraft`, `ImpactAnalysis`, `ReviewFinding`, `BugDraft`, `HealProposal`. The UI only consumes validated objects.

### 7.3 Prompt rules (in `lib/ai/prompts/`)
- Include the ERP glossary (`docs/glossary.md`: account, meter, OR, PO, DV and similar terms) and the relevant process steps.
- Ask for the technique label, priority and expected result for each case. The AI must say "unknown" instead of inventing business rules, and list open questions.
- Generated code must use role-based locators, the POM, no hard waits, and assertions taken from the test case.

### 7.4 Guardrails
- Allowlist check on every navigation and API call. The explorer has a denylist for risky actions (delete, post, approve, pay, close period) unless the user enables them for that session.
- The healer may change **locators and waits only**, never assertions or expected values. If the UI behavior changed, it marks the test `test.fixme()` and opens a defect draft.
- Token and step budgets per job, plus a monthly cap.

---

## 8. Phases

> **MVP = Phases 0–6** (about 6–9 weeks part-time). Phases 7–11 add maturity.

### Phase 0 — Prerequisites (manual)
- [ ] `git init`, first commit.
- [ ] Install Ollama. Set `OLLAMA_MODELS=D:\ollama\models` and pull a current 7–8B coder model (e.g. `qwen2.5-coder:7b`, or a newer one if available). Smoke test it.
- [ ] Get an Anthropic API key **with IT/DPO approval**. Create `.env.local`:
  ```
  ANTHROPIC_API_KEY=
  OLLAMA_BASE_URL=http://127.0.0.1:11434/v1
  OLLAMA_MODEL=qwen2.5-coder:7b
  DATABASE_URL="file:./dev.db"
  ERP_STAGING_URL=
  ERP_STAGING_API_URL=
  ERP_STAGING_DB_URL=          # read-only user
  ```
- [ ] A **staging ERP** with masked data, plus one test account per role (cashier, billing clerk, approver, procurement, accountant, HR, admin).
- [ ] Collect: the approved tariff schedule, payroll contribution and tax tables, approval matrix, chart of accounts, any OpenAPI/Swagger spec, and the ERP's DB type.
- [ ] Write `docs/glossary.md` (30–50 ERP terms) and `docs/roles.md` (role → allowed actions).
- [ ] Install the Playwright browsers: `npx playwright install chromium`.

**Done when:** `ollama run` works, the API key works, staging logins work for every role, and the reference documents are in `docs/`.

### Phase 1 — Foundation and domain model
Install Prisma, zod, vitest, shadcn/ui and decimal.js. Create the schema above and migrate. Build the app shell (sidebar), CRUD for Projects, Environments (with allowlist), Modules, Business Processes and the **Risk register** (L×I heat map). Add `lib/guard/allowlist.ts` with tests, then seed the four modules and four processes.
**Done when:** the risk register shows a heat map, the allowlist guard rejects non-staging URLs in unit tests, and lint, tsc and vitest pass.

### Phase 2 — AI layer
`lib/ai/router.ts` (`runTask({task, sensitive, input, schema?})`), providers, `redact.ts` (PH mobile numbers, emails, account/meter/OR number patterns, TIN, names from a configurable list, an optional local-LLM second pass), AuditLog writes, budget enforcement. Settings page with provider health, model overrides and an audit-log viewer.
**Done when:** the redaction test suite passes (at least 30 cases including Filipino names and ñ), both providers answer, sensitive tasks refuse the cloud, and cloud calls appear in the audit log.

### Phase 3 — Test design studio
Requirement input (paste, or upload .md/.docx/.pdf) with a sensitive toggle → AI drafts test cases (`TestCaseDraft[]`) with technique, priority, process link and open questions → editable grid → approve. **Traceability matrix** (requirement → cases → latest result → defects). Import the §6.4 seed catalog. Export to XLSX/CSV.
**Done when:** one billing requirement produces at least 15 labeled cases including boundaries and negatives, the traceability matrix renders, and the export opens in Excel.

### Phase 3.5 — QA Ticket Hub ★ current focus
QA and developers stop using Messenger for bugs. Runs on the office LAN behind login. The AI workbench (Phases 1–3 and
later) is hidden behind an admin toggle and paused for a major revision.
- **3.5a — Foundation:**
  - Local accounts (Admin / QA / Developer) with scrypt password hashing and DB sessions, using a hashed token in an httpOnly cookie.
  - Forced password change at first sign-in, a login rate limit, and Admin → Users.
  - An admin-editable **module → sub-module directory** (`ErpArea`) with leads, developers and QA (`AreaMember`).
  - The nav regrouped into Tickets / Admin / AI workbench.
  - LAN run scripts, SQLite WAL mode, and a backup script. See `docs/OPERATIONS.md`.
- **3.5b — Tickets:**
  - Tickets (bug / suggestion / improvement) with status workflow `NEW → IN_PROGRESS → FIXED → VERIFIED → CLOSED` (plus `REOPENED`, `NEED_INFO`, `REJECTED`, `DUPLICATE`, `WONT_FIX`).
  - QA picks the developer.
  - A built-in screenshot markup tool (box, arrow, pen, text, blur).
  - Videos up to 3 min / 150 MB in `UPLOAD_DIR`, served through an auth-checked route with Range support.
  - A conversation thread with attachments and a timeline of every change, an inbox with unread badges, a ticket dashboard, and CSV/XLSX export.

This replaces the planned Phase 9 Defects *screen*. The `Defect` model stays for the traceability code and is merged
into tickets in Phase 9.
**Done when:** a QA tester on one LAN machine files a ticket with a marked-up screenshot and a video for a developer on
another, they talk it through in the thread, the developer marks it fixed, QA verifies and closes it, and the timeline
shows every step.

### Phase 4 — Test data and oracles
`lib/oracles/*` with unit tests from the signed-off examples. Fixture builders that create referentially intact test records on staging through the ERP API or UI (customer + meter + reading; supplier + item + PR; employee + attendance). Read-only DB connector and `lib/recon` checks (balanced journals, subledger = GL, OR gaps, duplicate bills, negative stock). A Data page that lists the checks and runs them on demand.
**Done when:** the tariff and payroll oracles match the hand-worked examples exactly, and the recon checks run against staging and show pass/fail with details.

### Phase 5 — Automated runner (UI + API)
`playwright.config.ts` (projects per role using `storageState`, `workers: 2`, trace on first retry, JSON reporter). POMs for the core screens. A pipeline that generates a spec from an approved test case → `tests/generated/` → diff view → human approves → moved into `tests/`. API test generation from OpenAPI (status codes, schemas, auth, RBAC denial, boundaries). Run queue (child process, progress saved to the DB, live status via SSE or polling). Results page with screenshots, trace viewer link and error. Flaky detection (fail then pass on retry → `FLAKY`).
**Done when:** login and one billing screen pass for two roles, 10 API tests run, a deliberately broken test shows the screenshot and trace, and a run can be launched and watched from the UI.

### Phase 6 — Business-process suites ★ core value
One suite per process in `tests/processes/`, with assertions **at each hand-off**: UI action → API/DB state → oracle check → GL check.
- Meter-to-Cash: create account → reading → bill run → verify bill = tariff oracle → pay (partial and full) → OR check → GL check.
- P2P: PR → approvals by threshold → PO → partial receipt → invoice → 3-way match → voucher → payment → GL and inventory checks.
- R2R: post journals → close period → posting into the closed period rejected → trial balance balanced.
- Payroll: attendance → payroll run → gross-to-net = oracle → approval → payslip visibility per role → GL.
Process coverage widget on the dashboard.
**Done when:** all four suites run green on staging, and an injected wrong tariff or unbalanced entry is caught by the oracle or recon check.

### Phase 7 — Review assistant and change-impact selection
Inputs: a pasted diff, or `git diff <base>..<head>` from a local ERP repo path, plus logs and bug reports. Output: `ImpactAnalysis` (touched modules, processes and risks, suggested new cases, **selected regression tests by tag**). Button: "Run impacted tests". Logs are sensitive by default.
**Done when:** a sample diff in tariff code selects the billing `@critical` and Meter-to-Cash tests and suggests at least 3 new cases.

### Phase 8 — Exploratory agent
Claude tool loop (AI SDK tools): `navigate`, `click`, `fill`, `select`, `snapshot` (accessibility tree), `screenshot`, `read_console_errors`, `report_finding`. Runs as one role, with a goal and a step budget (default 40), allowlist and denylist guards. It streams steps to the UI. Findings → Haiku dedupe → bug drafts with repro steps and a screenshot.
**Done when:** "Explore the payment posting screen as a cashier" finishes within budget and produces at least one reproducible finding (or a clean report), and no denylisted action is attempted without permission.

### Phase 9 — Defects, controls suite, quality gate, reports
- Link tickets (Phase 3.5) to tests and merge the old `Defect` model into them. "Verify fix" re-runs the linked tests.
- **Controls suite** (`@controls`): RBAC matrix, segregation of duties, approval enforcement, audit-trail completeness, OR integrity, tariff table = approved schedule.
- **Quality gate** (configurable): e.g. 0 open S1/S2 defects, 100% of `@critical` passing, all recon checks passing, process coverage ≥ 90%, flaky rate < 5%.
- **Evidence pack** export (PDF/XLSX): scope, runs, results, defects, controls results, sign-off page. Useful for internal audit and COA reviews.
**Done when:** a release report generates with a pass or fail gate and readable evidence.

### Phase 10 — Non-functional (optional, pick by risk)
- Accessibility: `@axe-core/playwright` on key screens (WCAG 2.1 AA).
- Security baseline: auth and session tests, IDOR checks (one customer's ID used in another's URL or API), RBAC through the API, an optional OWASP ZAP baseline scan against staging (with IT approval).
- Performance: k6 script for a bill run and payment posting under expected peak load. Record the response time trend.

### Phase 11 — Hardening and operations
Scheduled nightly regression (Windows Task Scheduler running `npm run qa:nightly`), retention clean-up of `runs/`, `dev.db` backup, metrics dashboard (pass rate trend, defect leakage, mean time to detect, flaky list, AI cost per month), README with setup and runbook.

---

## 9. Metrics to track
Process coverage % · requirement coverage % · pass rate per tag · flaky rate · defects by module and severity · defect leakage (found after release vs before) · mean time to detect · automation ratio · AI cost per month · AI suggestion acceptance rate (how many drafts get approved).

## 10. Risks and mitigations
| Risk | Mitigation |
|---|---|
| Staging data drifts or gets polluted | Fixture builders create their own records with a `QA-` prefix, plus a periodic staging refresh from a masked copy |
| AI invents business rules | "Unknown + open questions" rule, human approval, deterministic oracles |
| Flaky UI tests erode trust | API-first, role-based locators, no hard waits, quarantine tag `@flaky` |
| Data privacy breach | Local routing, redaction tests, audit log, masked staging, DPO approval |
| Scope creep | MVP = Phases 0–6. Every phase must pass its "Done when" check |
| Laptop limits | Tag selection, `workers: 2`, overnight runs, models on the HDD |

## 11. Definition of Done (every phase)
- `npm run lint`, `npx tsc --noEmit` and `npx vitest run` pass. Playwright specs touched in this phase pass.
- No secrets in code or logs. New `lib/` modules have unit tests.
- A short note added to `docs/CHANGELOG.md`. Git commit `phase-N: <summary>`.

---

## 12. Working with Claude Code in VS Code

### 12.1 Per-phase prompt
```
Read CLAUDE.md and docs/PLAN.md. We are on Phase <N>.
1) Use plan mode: propose the file list, schema changes and steps. Wait for my approval.
2) Implement. Check current package docs before using an SDK API.
3) Run lint, tsc and vitest (plus playwright where relevant) and fix failures.
4) Summarize what changed and what I should test manually. Stop.
```

### 12.2 Suggested custom commands (`.claude/commands/`)
- `phase.md`: the prompt above, with `$ARGUMENTS` = phase number.
- `gen-tests.md`: "Generate Playwright tests for test case IDs $ARGUMENTS following tests/pages POMs; save to tests/generated/".
- `review-diff.md`: "Review this diff for ERP risks (money, approvals, RBAC, audit trail) and list impacted tags".

### 12.3 Playwright MCP and test agents (development time)
Add the Playwright MCP server to Claude Code. Then use the **planner** to explore a staging screen and draft a Markdown test plan, the **generator** to turn it into specs, and the **healer** to repair broken locators. Review everything before it goes into `tests/`. Check the current Playwright docs for the setup command, since the tooling changes quickly.

### 12.4 Habits
Commit before every phase, keep prompts to one phase, ask for plan mode first, and never paste production data into chat.

---

## 13. Open questions (answer before or during Phase 0)
1. ERP database engine and version? Is a read-only staging DB user available?
2. Does the ERP have an API (REST/OpenAPI), or is it UI-only?
3. Who signs off the oracle examples (billing, accounting, HR)?
4. Has IT/DPO approved cloud AI use, and under what conditions?
5. Is the ERP source code accessible locally (for Phase 7 diff analysis)?

## 14. Research sources
- ERP testing guides: [aqua-cloud SAP testing](https://aqua-cloud.io/sap-erp-testing-a-comprehensive-guide/), [testRigor ERP testing](https://testrigor.com/blog/erp-testing-guide/), [ACCELQ SAP testing](https://www.accelq.com/blog/sap-testing/), [IT Convergence Oracle regression](https://www.itconvergence.com/insights/oracle-erp-regression-testing-simplifying-the-process-and-reducing-downtime/)
- Business-process testing: [Virtuoso ERP testing](https://www.virtuosoqa.com/post/erp-software-testing), [Bug0 business process testing](https://bug0.com/knowledge-base/business-process-testing), [testRigor ERP 101](https://testrigor.com/blog/erp-testing-101/)
- AI in QA trends: [TestDino 2026 trends](https://testdino.com/blog/test-automation-trends-2026), [qa.tech trends](https://qa.tech/blog/qa-automation-trends-in-2025.md), [Inflectra 2026](https://inflectra.com/Ideas/Whitepaper/Software-Testing-Trends.aspx)
- Playwright agents: [Bug0 Playwright test agents](https://bug0.com/blog/playwright-test-agents), [TestDino Playwright AI ecosystem](https://testdino.com/blog/playwright-ai-ecosystem-2026), [TestQuality Claude Code + Playwright MCP](https://testquality.com/claude-code-playwright-mcp-ai-test-automation/)
- Risk-based testing: [Qase risk-based strategy](https://qase.io/blog/how-to-build-a-test-strategy-from-risks/), [Foidl & Felderer, Springer](https://link.springer.com/article/10.1007/s11219-016-9345-3)
- LLM oracles: [Do LLMs Generate Useful Test Oracles? (ASE 2025)](https://homes.cs.washington.edu/~mernst/pubs/neurosymbolic-oracles-ase2025-abstract.html)
- PH context: [Nueva Vizcaya billing digitalization after COA findings](https://nuevavizcaya.gov.ph/?p=23411), [COA on Cabanatuan water rates / LWUA review](https://malaya.com.ph/news/coa-to-cabanatuan-city-water-stop-higher-bill-rates), [RA 10173 IRR overview](https://www.cpomagazine.com/data-privacy/implementing-rules-regulations-philippines-data-privacy-act-ra-10173/)
