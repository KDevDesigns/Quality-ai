# Changelog

## Phase 1 — Foundation and domain model (2026-10-26)

- Prisma 7 + SQLite (better-sqlite3 driver adapter) with the full PLAN §5 data model; first migration `init`.
  List fields are `Json` because SQLite has no scalar lists. The client is generated to `lib/generated/prisma` (git-ignored).
- Idempotent seed (`npm run db:seed`): 1 project, a placeholder staging environment, 4 modules, 4 business processes and 12 example risks.
- `lib/guard/allowlist.ts`: exact-origin + normalized path-prefix URL guard. It refuses production environments, userinfo, non-http(s) URLs, lookalike hosts and dot-segment escapes. Covered by 30+ unit tests.
- `lib/risk/score.ts` (L×I score, bands, 5×5 heat map) and zod input schemas in `lib/schemas/`.
- App shell with a sidebar, plus pages for Dashboard, Projects, Environments (with a "Test a URL" box that runs the real guard), Modules, Processes (ordered step editor with hand-offs) and Risk register (heat map + filters).
- Removing the production flag from an environment requires typing its name.
- UI follows the DCWD ERP/HRMS design patterns:
  - indigo accent `#4f56d3`, Geist type, and a solid-indigo active item in the sidebar
  - breadcrumb top bar and centered footer
  - cards with a header bar, uppercase table headers, and status pills with a dot
  - underline tabs with count chips, step timelines, icon-box stat tiles and inline alerts
  - a confirm dialog before every delete
  - tokens live in `app/globals.css`, with dark-mode values ready.
- `dev`/`start` bind to 127.0.0.1. `allowedDevOrigins` allows both loopback names.
- Note: with Cache Components enabled, Next 16 forbids `export const runtime = "nodejs"`. Node is the only runtime, so it is omitted.
  DB reads call `await connection()` inside `<Suspense>`, so pages are never prerendered with stale data.
