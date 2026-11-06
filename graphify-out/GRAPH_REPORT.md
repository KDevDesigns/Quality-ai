# Graph Report - Quality-ai  (2026-11-06)

## Corpus Check
- 315 files · ~213,971 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .example 1)

## Summary
- 2284 nodes · 7110 edges · 123 communities (99 shown, 24 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 180 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a250f9e7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- button.tsx
- tickets/actions.ts
- createClient
- ticketStore
- ticket-form.tsx
- permissions.ts
- Form Field Components
- Database Tables and Migrations
- Sidebar Navigation
- lucide-react
- (main)/page.tsx
- vitest
- tickets/store.ts
- Topbar and Nav Rules
- DAR Periods and Page
- workflow.ts
- DAR Store and Autofill
- dar-editor.tsx
- Operations and Setup Guide
- ticket-controls.tsx
- image-picker.tsx
- Markup Editor Interaction
- notifications-card.tsx
- lib/backup.ts
- (main)/layout.tsx
- Ticket Board Page
- db.ts
- Theme and User Menu
- Runtime Dependencies
- Dev Dependencies
- dar/import.ts
- Markup Geometry
- shadcn Components Config
- (main)/page.tsx
- Settings Page and Sheets
- markup-editor.tsx
- date-picker.tsx
- Device Notification Docs
- shapes.ts
- video-picker.tsx
- Markup Image Export
- dar/actions.ts
- board.tsx
- push.test.ts
- TypeScript Config
- app-topbar.tsx
- Root Layout and Splash
- users/page.tsx
- Changelog Phases and Workflow
- Markup View and Zoom
- [number]/page.tsx
- npm Scripts
- format.ts
- shared-files.ts
- login/page.tsx
- ERP Billing API Pipeline
- template.ts
- QA Hub Roadmap Phases
- Business Process Test Suites
- TicketStatus
- session.ts
- Product Brief and Access Rules
- Account Administration Docs
- useImageAttachments
- Billing and Job Processes
- requireAction
- Learning Log
- account/actions.ts
- Project Rules and Hosting
- Database Connection Rules
- cron.ts
- Changelog Early Phases
- Service Worker
- Grill-me Config (.claude)
- Notifications and Markup Docs
- ESLint Config
- Install Prompt Hook
- Installable App and Push
- Grilling Skills
- Stack and Agent Rules
- ticket-tabs.tsx
- Upload and Session Rules
- Ticket Data Privacy Rule
- package.json
- My DAR Docs
- Allowed Install Scripts
- Env and Prisma Config
- Grilling Config (.claude)
- Markup and Inbox Docs
- BCA API Operating Model
- areas/import.ts
- Ticket Evidence Principles
- Vercel Config
- Replay and Healer Phases
- MCP Server Config
- Theme Colour Lessons
- Sign-up and Password Docs
- UI Polish Docs
- Risk-Based Test Selection
- Brand Commitments
- DCWD Seal (public)
- SelectField
- lucide-react
- UI (Web) Rework: developer handoff
- user.ts
- shell.js
- 6. Pages
- react
- notifications.ts

## God Nodes (most connected - your core abstractions)
1. `Button()` - 103 edges
2. `react` - 85 edges
3. `lucide-react` - 66 edges
4. `MarkupEditor()` - 60 edges
5. `next` - 57 edges
6. `vitest` - 48 edges
7. `requireAction()` - 46 edges
8. `TicketView()` - 40 edges
9. `TicketList()` - 38 edges
10. `Input()` - 38 edges

## Surprising Connections (you probably didn't know these)
- `10. States and interactions` --references--> `InlineAlert()`  [INFERRED]
  docs/design/ui-web-rework/HANDOFF.md → components/inline-alert.tsx
- `2. Suggested build order` --references--> `createTicket()`  [INFERRED]
  docs/design/ui-web-rework/HANDOFF.md → app/(main)/tickets/actions.ts
- `9. Don't copy from the prototype` --references--> `SelectField()`  [INFERRED]
  docs/design/ui-web-rework/HANDOFF.md → components/select-field.tsx
- `App shell` --references--> `navGroups()`  [INFERRED]
  docs/design/ui-web-rework/HANDOFF.md → components/nav.ts
- `Screenshot markup: `tickets/markup/`, `Markup.dc.html`` --references--> `short()`  [INFERRED]
  docs/design/ui-web-rework/HANDOFF.md → lib/dar/period.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Access control layers behind login** — claude_session_guards, claude_proxy_optimistic_redirect, claude_permissions_matrix, claude_admin_approved_accounts [EXTRACTED 1.00]
- **Four Business-Process Test Suites** — docs_plan_meter_to_cash, docs_plan_procure_to_pay, docs_plan_record_to_report, docs_plan_hire_to_retire, docs_plan_phase_6_process_suites [EXTRACTED 1.00]
- **Disaster recovery flow** — docs_operations_nightly_backup, docs_operations_task_scheduler_job, docs_operations_restore_procedure, docs_operations_first_time_supabase_setup [EXTRACTED 1.00]
- **Protected file upload and serving flow** — claude_rule_uploads, claude_attachments_bucket, claude_files_route, claude_avatar_route, claude_session_guards [EXTRACTED 1.00]
- **Customer data protection measures** — claude_rule_no_llm_ticket_data, claude_supabase_mcp_read_only, claude_rule_rls_on, product_principle_protect_customer_data, product_made_up_sample_content [INFERRED 0.85]
- **Customer data protection measures** — docs_operations_ticket_data_sensitivity, docs_operations_hide_tool, docs_operations_message_previews, docs_operations_nightly_backup, docs_operations_row_level_security [INFERRED 0.85]
- **Ticket status lifecycle surfaces** — docs_changelog_ticket_workflow, docs_changelog_move_back_step, docs_changelog_board_view, docs_changelog_progress_tracker [INFERRED 0.85]
- **Validate, Approve, Post Controls** — docs_erp_bca_api_process_flow_bam_memos, docs_erp_bca_api_process_flow_mcr, docs_glossary_bam, docs_glossary_mcr [INFERRED 0.85]

## Communities (123 total, 24 thin omitted)

### Community 0 - "button.tsx"
Cohesion: 0.17
Nodes (40): claimTempPassword(), ClaimCard(), UserFormState, DeleteUserDialog(), ApprovalContext, ApprovalHost(), Open, SignUpRequest (+32 more)

### Community 1 - "tickets/actions.ts"
Cohesion: 0.14
Nodes (25): addComment(), assignTicket(), categorizeTicket(), createTicket(), deleteTicket(), editTicket(), fields(), moveTicket() (+17 more)

### Community 2 - "createClient"
Cohesion: 0.13
Nodes (20): manifest(), importAreas(), parseSnapshot(), snapshotFiles(), takeSnapshot(), createClient(), getClient(), globalForPrisma (+12 more)

### Community 3 - "ticketStore"
Cohesion: 0.24
Nodes (12): manilaDay(), readWhere(), TicketError, ticketStore(), areaLabel(), assigneeName(), claimUploads(), filterWhere() (+4 more)

### Community 4 - "ticket-form.tsx"
Cohesion: 0.10
Nodes (31): EVIDENCE_BOX, EVIDENCE_INPUT, DraftCleanup(), AreaSelect(), DESCRIPTION_HINTS, ERROR_ORDER, SharedFiles, storage() (+23 more)

### Community 5 - "permissions.ts"
Cohesion: 0.15
Nodes (21): derive(), dummyPasswordHash(), hashPassword(), verifyPassword(), Action, ACTIONS, Flag, FLAG_GRANTS (+13 more)

### Community 6 - "Form Field Components"
Cohesion: 0.24
Nodes (18): ForgotForm(), LoginForm(), ROLE_CARDS, SignupForm(), PasswordForm(), UserForm(), MoveForm(), ResetSplash() (+10 more)

### Community 7 - "Database Tables and Migrations"
Cohesion: 0.09
Nodes (39): "AreaMember", AreaMember_areaId_idx, "Attachment", Attachment_storedName_key, Attachment_ticketId_idx, "DarProfile", "DarReport", DarReport_userId_periodStart_key (+31 more)

### Community 8 - "Sidebar Navigation"
Cohesion: 0.11
Nodes (28): brandText, fadeText, groupLabel, navButton, SidebarView(), filterNavGroups(), navGroups(), Separator() (+20 more)

### Community 9 - "lucide-react"
Cohesion: 0.11
Nodes (30): ModuleLink, ModuleList(), AreaRow(), Member, metadata, People(), SearchParams, TeamBody() (+22 more)

### Community 10 - "(main)/page.tsx"
Cohesion: 0.14
Nodes (27): ThreadRow(), adminHome(), CardHead(), Counts, DashboardPage(), firstName(), ICON_BOX, MainAndSide() (+19 more)

### Community 11 - "vitest"
Cohesion: 0.13
Nodes (9): normalizeEmail(), UserDeleteError, userDeletion(), vitest, t, cleanups, createTestDb(), Store (+1 more)

### Community 12 - "tickets/store.ts"
Cohesion: 0.06
Nodes (38): Tone, id, optionalText(), categoryInput, commentInput, emptyToNull, param, TICKET_GROUPS (+30 more)

### Community 13 - "Topbar and Nav Rules"
Cohesion: 0.11
Nodes (31): focusSoon(), AppTopbar(), AppTopbarShell(), BackButton(), PhoneNav, TopbarView(), BottomNav(), ACCOUNT_SECTIONS (+23 more)

### Community 14 - "DAR Periods and Page"
Cohesion: 0.11
Nodes (46): FunctionsEditor(), dar, DarBody(), DarPage(), metadata, FirstPeriodField(), dar, DarSetupPage() (+38 more)

### Community 15 - "workflow.ts"
Cohesion: 0.10
Nodes (36): Ticket detail: `tickets/[number]/page.tsx`, `Ticket.dc.html`, can(), BOARD_COLUMNS, movesInto(), allowedTransitions(), canAssign(), canAssignTicket(), canCategorize() (+28 more)

### Community 16 - "DAR Store and Autofill"
Cohesion: 0.09
Nodes (44): focusCell(), FONT, FunctionRows(), Activity, ActivityArea, areaLabel(), buildCells(), CELL_MAX (+36 more)

### Community 17 - "dar-editor.tsx"
Cohesion: 0.15
Nodes (20): refillDar(), DarEditor(), download(), print(), refill(), save(), PeriodOption, DarSheet() (+12 more)

### Community 18 - "Operations and Setup Guide"
Cohesion: 0.12
Nodes (24): Storage bucket attachments, BACKUP_DIR, CRON_SECRET, Daily clean-up cron (/api/cron/daily), DATABASE_URL, Deployment flow, DIRECT_URL, .env.example (+16 more)

### Community 19 - "ticket-controls.tsx"
Cohesion: 0.23
Nodes (16): AttachMenu(), EvidenceBox(), cameraInputId(), ImagePicker(), AssignForm(), CommentForm(), NOTE_HINTS, Ref (+8 more)

### Community 20 - "image-picker.tsx"
Cohesion: 0.22
Nodes (13): canCaptureScreen(), ImageAttachments, Item, Queued, useCanCapture(), VideoUpload, IMAGE_MAX_BYTES, IMAGE_TYPES (+5 more)

### Community 21 - "Markup Editor Interaction"
Cohesion: 0.12
Nodes (32): desktopStageHeight(), hasText(), MarkupEditor(), applyFont(), bumpSize(), commitEdit(), movePinch(), onDoubleClick() (+24 more)

### Community 22 - "notifications-card.tsx"
Cohesion: 0.09
Nodes (46): AccountTabs(), onKeyDown(), pick(), pushStatus(), saveTone(), currentSubscription(), DeviceState, deviceState() (+38 more)

### Community 23 - "lib/backup.ts"
Cohesion: 0.27
Nodes (9): areaLevels(), ownDarDetails(), restoreSnapshot(), Snapshot, SNAPSHOT_TABLES, SNAPSHOT_VERSION, SnapshotTable, adoptLegacyTemplate() (+1 more)

### Community 24 - "(main)/layout.tsx"
Cohesion: 0.11
Nodes (31): playTone(), MainLayout(), SessionBottomNav(), SessionSidebar(), SessionTopbar(), sessionUser(), markAllTicketsRead(), ToneListener() (+23 more)

### Community 25 - "Ticket Board Page"
Cohesion: 0.11
Nodes (24): reporterOptions(), hrefWith(), metadata, MORE, NewTicketButton(), notifications, Pager(), Quick (+16 more)

### Community 26 - "db.ts"
Cohesion: 0.06
Nodes (65): GET(), GET(), GET(), DELETE(), POST(), tickets, fail(), uploader() (+57 more)

### Community 27 - "Theme and User Menu"
Cohesion: 0.18
Nodes (18): AccentDots(), SidebarUser, AppearancePicker(), MODES, listeners, readAccent(), setAccent(), useAccent() (+10 more)

### Community 28 - "Runtime Dependencies"
Cohesion: 0.08
Nodes (25): dependencies, @base-ui/react@^1.9.0, cn@^0.5.0, lucide-react@^1.61.0, next@16.4.3, @prisma/adapter-pg@^7.10.1, @prisma/client@^7.10.1, react@19.3.0 (+17 more)

### Community 29 - "Dev Dependencies"
Cohesion: 0.09
Nodes (22): devDependencies, pglite-prisma-adapter@^0.7.2, @playwright/test@^1.64.1, tailwindcss@^4, @tailwindcss/turbopack@^4, tsx@^4.23.15, @types/node@^24.19.2, @types/pg@^8.23.1 (+14 more)

### Community 30 - "dar/import.ts"
Cohesion: 0.12
Nodes (33): attr(), cellsOf(), clean(), columnIndex(), DarImportError, decode(), detectScheme(), ENTITY (+25 more)

### Community 31 - "Markup Geometry"
Cohesion: 0.15
Nodes (22): onPointerMove(), drawSelection(), bounds(), calloutBox(), distToSegment(), estimateWidth(), Handle, handlesOf() (+14 more)

### Community 32 - "shadcn Components Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 33 - "(main)/page.tsx"
Cohesion: 0.08
Nodes (53): metadata, NewTicket(), NewTicketPage(), GET(), tickets, AccountSkeleton(), Bone(), DarSkeleton() (+45 more)

### Community 34 - "Settings Page and Sheets"
Cohesion: 0.13
Nodes (29): Group(), metadata, Row(), SettingsBody(), SettingsPage(), AppearanceRow(), RequestsCount(), SignOutRow() (+21 more)

### Community 35 - "markup-editor.tsx"
Cohesion: 0.16
Nodes (22): Drag, exportImage(), MarkupResult, Pinch, TextEdit, CROP_DIM, CROP_LINE, DEFAULT_MARK_COLOR (+14 more)

### Community 36 - "date-picker.tsx"
Cohesion: 0.25
Nodes (17): DatePicker(), moveTo(), onKeyDown(), pick(), addDays(), addMonths(), CalendarDay, isoDate() (+9 more)

### Community 37 - "Device Notification Docs"
Cohesion: 0.13
Nodes (19): Device notifications (web push), Install as an app (Phase 3.7c), User.offHoursPush outside-hours choice, Filing tickets from a phone (Phase 3.7b), Service worker (public/sw.js), Share to QA Hub (Android share target), Sign out all devices, New ticket drafts (+11 more)

### Community 38 - "shapes.ts"
Cohesion: 0.23
Nodes (10): MarkupToolbar(), SHORTCUT_HELP, TOOL_BUTTONS, clampRect(), cropOf(), RectShape, TEXT_SIZES, TextSize (+2 more)

### Community 39 - "video-picker.tsx"
Cohesion: 0.20
Nodes (19): connectionType(), probeDuration(), Upload, useVideoUpload(), send(), start(), toAvatarFile(), useAvatarUpload() (+11 more)

### Community 40 - "Markup Image Export"
Cohesion: 0.15
Nodes (24): encodeCanvas(), Encoded, shrinkImage(), toBlob(), baseName(), CONVERT_ABOVE_BYTES, convertedName(), JPEG (+16 more)

### Community 41 - "dar/actions.ts"
Cohesion: 0.30
Nodes (12): emailError(), requestPasswordReset(), signup(), dar, importPayload, saveDar(), saveDarProfile(), fromZodError() (+4 more)

### Community 42 - "board.tsx"
Cohesion: 0.09
Nodes (41): BoardCard, BoardColumnData, Card(), CardMenu(), ColumnTabs(), Pending, Person(), stillPending() (+33 more)

### Community 43 - "push.test.ts"
Cohesion: 0.10
Nodes (34): clip(), PushEvent, PushMessage, pushMessage(), PushTicket, Candidate, Delivery, delivery() (+26 more)

### Community 44 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 45 - "app-topbar.tsx"
Cohesion: 0.26
Nodes (15): BAR, INK, ModuleProgressCard(), ModuleProgressSection(), scoreText(), ModuleScope(), ScoreDot(), StepTip() (+7 more)

### Community 46 - "Root Layout and Splash"
Cohesion: 0.15
Nodes (14): geistMono, geistSans, metadata, RootLayout(), viewport, AppSplash(), STEPS, Preloader() (+6 more)

### Community 47 - "users/page.tsx"
Cohesion: 0.13
Nodes (23): metadata, one(), RequestList(), RequestRow, STATUS_TONE, Tab, TABS, UsersBody() (+15 more)

### Community 48 - "Changelog Phases and Workflow"
Cohesion: 0.15
Nodes (17): Phase 2 AI layer (removed workbench), Tickets Board view, QA Hub Changelog, DAR on long bond paper, My DAR for everyone, own details, My DAR first period and rolling periods, Phase 3.5a QA Hub foundation, Move a ticket back a step (+9 more)

### Community 49 - "Markup View and Zoom"
Cohesion: 0.15
Nodes (15): FONT_MAX, FONT_MIN, isTiny(), Shape, MAX_CANVAS_PX, offset(), Size, Vec (+7 more)

### Community 50 - "[number]/page.tsx"
Cohesion: 0.09
Nodes (40): hrefWith(), inbox, Inbox(), InboxPage(), metadata, Params, parse(), tickets (+32 more)

### Community 51 - "npm Scripts"
Cohesion: 0.12
Nodes (17): scripts, areas:import, backup, build, db:deploy, db:generate, db:migrate, db:seed (+9 more)

### Community 52 - "format.ts"
Cohesion: 0.08
Nodes (45): Attachments(), EventIcon(), EventText(), Evidence(), FileRow, ImageList(), Item, Message() (+37 more)

### Community 53 - "shared-files.ts"
Cohesion: 0.20
Nodes (12): PwaSetup(), showBadge(), removeAllDrafts(), dropAllSharedFiles(), dropOldSharedFiles(), SHARED_AT_HEADER, SHARED_CACHE, SHARED_MAX_AGE_MS (+4 more)

### Community 54 - "login/page.tsx"
Cohesion: 0.16
Nodes (15): signupStatus(), AuthTabs(), TABS, BrandPane(), BrandText(), CHIPS, LoginBody(), LoginPage() (+7 more)

### Community 55 - "ERP Billing API Pipeline"
Cohesion: 0.16
Nodes (14): API.Cloud Host, API On-Premise Host, dcwd_apps-csms-bca-api, BCS, BCS Export Queue, CloudDataContext, DataContext, Meter-Reading Field-to-Bill Workflow (+6 more)

### Community 56 - "template.ts"
Cohesion: 0.09
Nodes (24): dar, GET(), boxed(), darXlsx(), LINE, longBondOnOnePage(), row(), rowHeight() (+16 more)

### Community 57 - "QA Hub Roadmap Phases"
Cohesion: 0.21
Nodes (13): Cloud Move to Vercel + Supabase, My DAR (Daily Accomplishment Report), Phase 3.10 UI Polish, Phase 3.5 QA Ticket Hub, Phase 3.6a Test Library and Manual Runs, Phase 3.7 QA Hub on Phones, Phase 3.7a Mobile UI Rework, Phase 3.7b Filing from the Phone (+5 more)

### Community 58 - "Business Process Test Suites"
Cohesion: 0.18
Nodes (12): GL (General Ledger), Gross-to-Net, OR (Official Receipt), Oracle, Recon Check, 3-Way Match, Hire-to-Retire / Time-to-Pay Process, Meter-to-Cash Process (+4 more)

### Community 59 - "TicketStatus"
Cohesion: 0.09
Nodes (26): Flow, FlowInput, FlowStep, FlowStepState, FlowTone, PATH, PathStatus, STEP_LABELS (+18 more)

### Community 60 - "session.ts"
Cohesion: 0.14
Nodes (19): ClaimState, login(), logout(), SignupState, SESSION_COOKIE, SESSION_MAX_AGE_S, sessionCookieOptions(), safeNext() (+11 more)

### Community 61 - "Product Brief and Access Rules"
Cohesion: 0.20
Nodes (8): Own accounts with admin-approved sign-ups, Nightly npm run backup on the QA laptop, Permissions matrix in lib/auth/permissions.ts, proxy.ts optimistic redirect, Daily Accomplishment Report in 15-day periods, QA Hub product brief, Roles: Admin, QA tester, Developer, Who's-who directory of module owners

### Community 62 - "Account Administration Docs"
Cohesion: 0.20
Nodes (8): Delete user, Designer tick-box (FLAG_GRANTS), Deleting an account, Account management, Design reviews, Designer flag, Failed sign-in lock-out, Password reset requests

### Community 63 - "useImageAttachments"
Cohesion: 0.36
Nodes (9): captureFrame(), useImageAttachments(), add(), enqueue(), onPaste(), remove(), resolve(), send() (+1 more)

### Community 64 - "Billing and Job Processes"
Cohesion: 0.22
Nodes (10): BAM and Debit/Credit Memos, Billing and Collection Process, JMS Service-Job Workflow, MCR Control Flow, Order of Payment, BAM (Billing Adjustment Memo), JMS (Job Management System), MCR (Customer Record Change) (+2 more)

### Community 65 - "requireAction"
Cohesion: 0.23
Nodes (17): approveSignUp(), createUser(), deleteUser(), deletion, deletionPreview(), dismissResetRequest(), duplicateEmail(), rejectSignUp() (+9 more)

### Community 66 - "Learning Log"
Cohesion: 0.25
Nodes (8): Additive migration first, code second, Cron job and CRON_SECRET, Learning Log, Magic bytes file type detection, Signed URL, SSRF host allow-list, Vercel env vars are read at build time, Daily clean-up GET /api/cron/daily

### Community 67 - "account/actions.ts"
Cohesion: 0.18
Nodes (18): avatars, changePassword(), dropFile(), myTone(), push, removeAvatar(), removePushSubscription(), saveAvatar() (+10 more)

### Community 68 - "Project Rules and Hosting"
Cohesion: 0.25
Nodes (6): Private attachments bucket, QA Hub project rules, Supabase Postgres and Storage (ap-southeast-1), Vercel hosting (sin1), Local setup steps, QA Hub README

### Community 69 - "Database Connection Rules"
Cohesion: 0.38
Nodes (5): Connection string and pooler, RLS with no policies denies the public API, DATABASE_URL transaction pooler, DIRECT_URL session pooler, Prisma 7 client via lib/db-client.ts

### Community 70 - "cron.ts"
Cohesion: 0.31
Nodes (6): GET(), createRateLimiter(), RATE_LIMIT_KEEP_MS, RateLimiter, cronAuthorized(), dailyCleanup()

### Community 71 - "Changelog Early Phases"
Cohesion: 0.29
Nodes (4): lib/backup.ts backup and restore, QA Hub moves to Vercel + Supabase, Daily clean-up cron (changelog), Profile photo and per-person colours

### Community 72 - "Service Worker"
Cohesion: 0.43
Nodes (4): askToPlay(), playInATab(), qaHubTabs(), refreshTabs()

### Community 73 - "Grill-me Config (.claude)"
Cohesion: 0.33
Nodes (5): interface, display_name, short_description, policy, allow_implicit_invocation

### Community 74 - "Notifications and Markup Docs"
Cohesion: 0.33
Nodes (5): My inbox, Notification bell, Notifications, Mark up screenshot tools, Sidebar counts

### Community 75 - "ESLint Config"
Cohesion: 0.33
Nodes (5): eslintConfig, eslint@^9, eslint-config-next@16.4.3, eslint, eslint-config-next

### Community 76 - "Install Prompt Hook"
Cohesion: 0.47
Nodes (5): changed(), InstallEvent, listeners, subscribe(), useInstallPrompt()

### Community 77 - "Installable App and Push"
Cohesion: 0.40
Nodes (3): VAPID keys, Web Push service worker and subscription, Installable app with push notifications

### Community 78 - "Grilling Skills"
Cohesion: 0.40
Nodes (4): grill-me skill (.claude), Design tree (.claude), Decision frontier (.claude), grilling skill (.claude)

### Community 79 - "Stack and Agent Rules"
Cohesion: 0.40
Nodes (4): Next.js agent feedback pass, Next.js agent rules, Stack: Next.js 16, React 19, TypeScript, Tailwind 4, Vitest on PGlite

### Community 80 - "ticket-tabs.tsx"
Cohesion: 0.24
Nodes (10): ActiveTab, tabId(), TABS, TicketHeader(), TicketTab, TicketTabs(), onKeyDown(), onTouchEnd() (+2 more)

### Community 81 - "Upload and Session Rules"
Cohesion: 0.50
Nodes (3): Avatar route app/(main)/files/avatar/[userId], File route app/(main)/files/[id], Session guards in lib/auth/session.ts

### Community 83 - "package.json"
Cohesion: 0.12
Nodes (15): class-variance-authority@^0.7.1, next-themes@^0.4.6, pg@^8.23.1, @supabase/supabase-js@^2.118.0, @electric-sql/pglite@^0.4.3, @types/web-push@^3.6.4, name, private (+7 more)

### Community 84 - "My DAR Docs"
Cohesion: 0.40
Nodes (4): My DAR set-up, Module codes, My DAR (Daily Accomplishment Report), Team & modules

### Community 85 - "Allowed Install Scripts"
Cohesion: 0.40
Nodes (5): allowScripts, esbuild@0.28.2, prisma@7.10.1, @prisma/engines@7.10.1, unrs-resolver@1.12.2

### Community 86 - "Env and Prisma Config"
Cohesion: 0.40
Nodes (4): dotenv@^18.0.9, prisma@^7.10.1, dotenv, prisma

### Community 87 - "Grilling Config (.claude)"
Cohesion: 0.50
Nodes (3): interface, display_name, short_description

### Community 88 - "Markup and Inbox Docs"
Cohesion: 0.50
Nodes (3): My inbox, Messenger-style, Notification bell and TicketRead, Screenshot markup editor

### Community 89 - "BCA API Operating Model"
Cohesion: 0.67
Nodes (3): Recommended Operating Model, DCWD CSMS BCA API Process Flow, ERP Glossary

### Community 90 - "areas/import.ts"
Cohesion: 0.29
Nodes (6): areaFile, AreaFile, code, ImportReport, Row, subArea

### Community 92 - "Vercel Config"
Cohesion: 0.50
Nodes (3): crons, regions, $schema

### Community 112 - "SelectField"
Cohesion: 0.19
Nodes (13): AccountTab, ALIASES, Option(), OptionLabel(), SelectField(), SelectOption, SelectOptionGroup, SelectContent() (+5 more)

### Community 116 - "lucide-react"
Cohesion: 0.27
Nodes (9): ToneSelect(), PushPrompt(), notNow(), read(), write(), AlertTone, ICON, STYLE (+1 more)

### Community 117 - "UI (Web) Rework: developer handoff"
Cohesion: 0.12
Nodes (15): 10. States and interactions, 11. Motion, 12. Edge cases and limits, 13. Done means, 1. Decisions, 2. Suggested build order, 3. Sizes and layout, 4. Design tokens (+7 more)

### Community 118 - "user.ts"
Cohesion: 0.11
Nodes (23): duplicateCode(), saveArea(), AreaNode, nextSortOrder(), placementError(), areaInput, AreaInput, areaMembersInput (+15 more)

### Community 119 - "shell.js"
Cohesion: 0.27
Nodes (10): apply(), closeMenu(), fillPanel(), hideTip(), icon(), markAllRead(), openMenu(), setPanel() (+2 more)

### Community 120 - "6. Pages"
Cohesion: 0.11
Nodes (22): 6. Pages, Dashboard: `app/(main)/page.tsx`, `Main.dc.html`, My account: `account/`, `Account.dc.html`, My DAR: `dar/`, `Dar.dc.html`, My DAR set-up: `dar/setup/`, `DarSetup.dc.html`, My inbox: `inbox/page.tsx`, `Inbox.dc.html`, New ticket: `tickets/new/page.tsx`, `ticket-form.tsx`, `NewTicket.dc.html`, Screenshot markup: `tickets/markup/`, `Markup.dc.html` (+14 more)

### Community 123 - "react"
Cohesion: 0.12
Nodes (5): Badge(), badgeVariants, @base-ui/react, cn, react

### Community 127 - "notifications.ts"
Cohesion: 0.12
Nodes (14): notifications, ticketCreate, TicketCreate, describeEvent(), inboxStore(), LastEvent, previewOf(), scopeSql() (+6 more)

## Knowledge Gaps
- **62 isolated node(s):** `Davao City Water District (DCWD)`, `DCWD Seal (Davao City Water District logo, circular navy seal with water faucet, est. 1973)`, `DATABASE_URL`, `Promote to Production rollback`, `Task Scheduler job QA Hub backup` (+57 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 574 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `button.tsx`, `ticket-form.tsx`, `Form Field Components`, `Sidebar Navigation`, `lucide-react`, `(main)/page.tsx`, `Topbar and Nav Rules`, `DAR Periods and Page`, `DAR Store and Autofill`, `dar-editor.tsx`, `ticket-controls.tsx`, `image-picker.tsx`, `notifications-card.tsx`, `(main)/layout.tsx`, `Ticket Board Page`, `Theme and User Menu`, `Runtime Dependencies`, `(main)/page.tsx`, `Settings Page and Sheets`, `markup-editor.tsx`, `date-picker.tsx`, `video-picker.tsx`, `board.tsx`, `app-topbar.tsx`, `Root Layout and Splash`, `users/page.tsx`, `[number]/page.tsx`, `format.ts`, `shared-files.ts`, `login/page.tsx`, `session.ts`, `Install Prompt Hook`, `ticket-tabs.tsx`, `package.json`, `SelectField`, `lucide-react`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `MarkupEditor()` (e.g. with `zoomTo()` and `redo()`) actually correct?**
  _`MarkupEditor()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Davao City Water District (DCWD)`, `DCWD Seal (Davao City Water District logo, circular navy seal with water faucet, est. 1973)`, `DATABASE_URL` to the rest of the system?**
  _62 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `tickets/actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1396011396011396 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `vitest` to `createClient`, `ticket-form.tsx`, `permissions.ts`, `lucide-react`, `tickets/store.ts`, `Topbar and Nav Rules`, `DAR Periods and Page`, `workflow.ts`, `DAR Store and Autofill`, `notifications-card.tsx`, `Ticket Board Page`, `db.ts`, `Theme and User Menu`, `Dev Dependencies`, `dar/import.ts`, `(main)/page.tsx`, `date-picker.tsx`, `Markup Image Export`, `push.test.ts`, `users/page.tsx`, `Markup View and Zoom`, `[number]/page.tsx`, `format.ts`, `shared-files.ts`, `template.ts`, `TicketStatus`, `ticket-tabs.tsx`, `package.json`, `user.ts`, `6. Pages`, `notifications.ts`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.1265597147950089 - nodes in this community are weakly interconnected._
- **Why does `next` connect `login/page.tsx` to `button.tsx`, `tickets/actions.ts`, `ticket-form.tsx`, `Form Field Components`, `Sidebar Navigation`, `lucide-react`, `(main)/page.tsx`, `Topbar and Nav Rules`, `DAR Periods and Page`, `dar-editor.tsx`, `image-picker.tsx`, `notifications-card.tsx`, `(main)/layout.tsx`, `Ticket Board Page`, `db.ts`, `Theme and User Menu`, `Runtime Dependencies`, `(main)/page.tsx`, `Settings Page and Sheets`, `dar/actions.ts`, `board.tsx`, `app-topbar.tsx`, `Root Layout and Splash`, `users/page.tsx`, `[number]/page.tsx`, `template.ts`, `session.ts`, `requireAction`, `account/actions.ts`, `cron.ts`, `ticket-tabs.tsx`, `package.json`, `SelectField`, `lucide-react`, `user.ts`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._