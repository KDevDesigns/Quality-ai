# Graph Report - Quality-ai  (2026-11-06)

## Corpus Check
- 325 files · ~215,976 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .example 1)

## Summary
- 2294 nodes · 6637 edges · 143 communities (114 shown, 29 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 180 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4fd5a722`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- lucide-react
- login/page.tsx
- lib/backup.ts
- format.ts
- draft.ts
- (main)/page.tsx
- requireAction
- permissions.ts
- sidebar.tsx
- team/page.tsx
- 20261030000000_init_postgres/migration.sql
- vitest
- tickets/store.ts
- nav.ts
- period.ts
- board.tsx
- dar/store.ts
- dar-sheet.tsx
- Environment variables
- account/actions.ts
- image-picker.tsx
- MarkupEditor
- setup/page.tsx
- template.ts
- notifications-panel.tsx
- tickets/page.tsx
- uploads/storage.ts
- user-menu.tsx
- dependencies
- devDependencies
- dar/import.ts
- shapes.ts
- components.json
- files.ts
- settings-bits.tsx
- markup-editor.tsx
- date-picker.tsx
- Device notifications
- notifications.ts
- tickets/actions.ts
- markup.test.ts
- shapes.ts
- workflow.ts
- users/page.tsx
- compilerOptions
- shared-files.ts
- app/layout.tsx
- requireUser
- QA Hub Changelog
- view.ts
- ticket-view.tsx
- scripts
- avatar-upload.tsx
- ticketStore
- package.json
- dcwd_apps-csms-bca-api
- dar-sheet.tsx
- QA AI for In-House ERP Build Plan
- Phase 6 Business-Process Suites
- UI (Web) Rework: developer handoff
- getCurrentUser
- QA Hub product brief
- Account management
- ticket-peek.tsx
- Billing and Collection Process
- image-picker.tsx
- Learning Log
- device-push.ts
- QA Hub project rules
- Prisma 7 client via lib/db-client.ts
- ticket-tabs.tsx
- QA Hub moves to Vercel + Supabase
- sw.js
- interface
- Notifications
- tree.ts
- PushPrompt
- Web Push service worker and subscription
- grilling skill (.claude)
- Stack: Next.js 16, React 19, TypeScript, Tailwind 4
- video-upload.test.ts
- Hard rule: uploads use generated names and post-upload checks
- Hard rule: ticket data never goes to an LLM
- Grabber
- My DAR (Daily Accomplishment Report)
- ticket-form.tsx
- next
- interface
- Hide tool (solid black box)
- DCWD CSMS BCA API Process Flow
- report.ts
- Ticket with evidence and conversation
- vercel.json
- Phase 3.6b Record and Replay Regression
- .mcp.json
- CSS variables for themes
- Forgot password request flow
- Light/dark mode and theme colours
- Risk-Based Testing (ISO/IEC 25010)
- Brand commitments: DCWD seal and formal government tone
- Davao City Water District (DCWD)
- inbox/page.tsx
- team/actions.ts
- shell.js
- account/page.tsx
- users-filter.test.ts
- user-menu.tsx
- (main)/layout.tsx
- signup-form.tsx
- TicketStatus
- session.ts
- How tickets connect to Module progress
- log.ts
- lib/backup.ts
- hitTest
- tones.ts
- notifications-card.tsx
- holidays.ts
- dar-migration.test.ts
- reset-password.ts
- allowScripts
- badge.tsx
- eslint.config.mjs
- zod

## God Nodes (most connected - your core abstractions)
1. `react` - 87 edges
2. `lucide-react` - 67 edges
3. `MarkupEditor()` - 59 edges
4. `next` - 59 edges
5. `Button()` - 58 edges
6. `vitest` - 48 edges
7. `requireAction()` - 45 edges
8. `TicketView()` - 44 edges
9. `TicketList()` - 39 edges
10. `can()` - 37 edges

## Surprising Connections (you probably didn't know these)
- `10. States and interactions` --references--> `InlineAlert()`  [INFERRED]
  docs/design/ui-web-rework/HANDOFF.md → components/inline-alert.tsx
- `My DAR: `dar/`, `Dar.dc.html`` --references--> `periodDays()`  [INFERRED]
  docs/design/ui-web-rework/HANDOFF.md → lib/dar/period.ts
- `Screenshot markup: `tickets/markup/`, `Markup.dc.html`` --references--> `short()`  [INFERRED]
  docs/design/ui-web-rework/HANDOFF.md → lib/dar/period.ts
- `App shell` --references--> `navGroups()`  [INFERRED]
  docs/design/ui-web-rework/HANDOFF.md → components/nav.ts
- `2. Suggested build order` --references--> `createTicket()`  [INFERRED]
  docs/design/ui-web-rework/HANDOFF.md → app/(main)/tickets/actions.ts

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

## Communities (143 total, 29 thin omitted)

### Community 0 - "lucide-react"
Cohesion: 0.22
Nodes (19): copyText(), TempPassword(), UserValues, GalleryContext, useCloseGuard(), AlertTone, ICON, InlineAlert() (+11 more)

### Community 1 - "login/page.tsx"
Cohesion: 0.16
Nodes (18): signupStatus(), AuthTabs(), ClaimCard(), ForgotForm(), LoginForm(), BrandPane(), BrandText(), CHIPS (+10 more)

### Community 2 - "lib/backup.ts"
Cohesion: 0.12
Nodes (19): manifest(), AreaFile, code, importAreas(), ImportReport, Row, subArea, snapshotFiles() (+11 more)

### Community 3 - "format.ts"
Cohesion: 0.10
Nodes (26): Attachments(), Evidence(), FileRow, Item, GalleryImage, show(), ImageThumb(), connectionType() (+18 more)

### Community 4 - "draft.ts"
Cohesion: 0.17
Nodes (18): DraftCleanup(), storage(), TicketForm(), clearDraft(), TicketFormFields(), DRAFT_FIELDS, DRAFT_MAX_AGE_MS, draftKey() (+10 more)

### Community 5 - "(main)/page.tsx"
Cohesion: 0.08
Nodes (39): ModuleProgressSection(), adminHome(), Counts, DashboardPage(), firstName(), ICON_BOX, MainAndSide(), Me (+31 more)

### Community 6 - "requireAction"
Cohesion: 0.18
Nodes (21): emailError(), requestPasswordReset(), signup(), changePassword(), PasswordForm(), createUser(), duplicateEmail(), updateUser() (+13 more)

### Community 7 - "permissions.ts"
Cohesion: 0.15
Nodes (20): derive(), dummyPasswordHash(), hashPassword(), verifyPassword(), Action, ACTIONS, Flag, FLAG_GRANTS (+12 more)

### Community 8 - "sidebar.tsx"
Cohesion: 0.08
Nodes (25): brandText, fadeText, groupLabel, navButton, Separator(), Sidebar(), SidebarContent(), SidebarContext (+17 more)

### Community 9 - "team/page.tsx"
Cohesion: 0.12
Nodes (20): ModuleLink, ModuleList(), Member, metadata, SearchParams, TeamBody(), teamHref(), AreaDialog() (+12 more)

### Community 10 - "20261030000000_init_postgres/migration.sql"
Cohesion: 0.09
Nodes (39): "AreaMember", AreaMember_areaId_idx, "Attachment", Attachment_storedName_key, Attachment_ticketId_idx, "DarProfile", "DarReport", DarReport_userId_periodStart_key (+31 more)

### Community 11 - "vitest"
Cohesion: 0.12
Nodes (16): GET(), GET(), createRateLimiter(), RATE_LIMIT_KEEP_MS, RateLimiter, cronAuthorized(), dailyCleanup(), getClient() (+8 more)

### Community 12 - "tickets/store.ts"
Cohesion: 0.06
Nodes (33): categoryInput, commentInput, emptyToNull, param, TICKET_GROUPS, ticketCreate, TicketCreate, ticketEdit (+25 more)

### Community 13 - "nav.ts"
Cohesion: 0.11
Nodes (34): focusSoon(), SidebarView(), AppTopbar(), AppTopbarShell(), BackButton(), PhoneNav, TopbarView(), BottomNav() (+26 more)

### Community 14 - "period.ts"
Cohesion: 0.14
Nodes (35): dar, DarBody(), DarPage(), metadata, FirstPeriodField(), addDays(), DOWS, firstPeriodOf() (+27 more)

### Community 15 - "board.tsx"
Cohesion: 0.21
Nodes (13): BoardColumnData, ColumnTabs(), Pending, stillPending(), Task, TaskDialog(), TicketBoard(), without() (+5 more)

### Community 16 - "dar/store.ts"
Cohesion: 0.15
Nodes (29): Activity, ActivityArea, areaLabel(), buildCells(), DarCells, dayEntries(), daysAttended(), defaultEntry() (+21 more)

### Community 17 - "dar-sheet.tsx"
Cohesion: 0.16
Nodes (16): DarEditor(), download(), print(), refill(), save(), br(), DAR_COLORS, darHtml() (+8 more)

### Community 18 - "Environment variables"
Cohesion: 0.12
Nodes (24): Storage bucket attachments, BACKUP_DIR, CRON_SECRET, Daily clean-up cron (/api/cron/daily), DATABASE_URL, Deployment flow, DIRECT_URL, .env.example (+16 more)

### Community 19 - "account/actions.ts"
Cohesion: 0.08
Nodes (38): avatars, push, savePushSubscription(), SIGNUP_COOKIE, signupCookieOptions, deviceLabel(), clip(), PushEvent (+30 more)

### Community 20 - "image-picker.tsx"
Cohesion: 0.13
Nodes (20): AttachMenu(), EVIDENCE_BOX, EVIDENCE_INPUT, EvidenceBox(), canCaptureScreen(), ImageAttachments, useCanCapture(), VideoUpload (+12 more)

### Community 21 - "MarkupEditor"
Cohesion: 0.13
Nodes (29): hasText(), MarkupEditor(), applyFont(), bumpSize(), movePinch(), onFingerDown(), onFingerMove(), onKeyDown() (+21 more)

### Community 22 - "setup/page.tsx"
Cohesion: 0.20
Nodes (17): Device, InstallCard(), noChange(), importDar(), Fact(), ImportDar(), apply(), dar (+9 more)

### Community 23 - "template.ts"
Cohesion: 0.10
Nodes (16): DEFAULT_SCHEME, PERIOD_SCHEMES, DarUser, adoptLegacyTemplate(), DarHeader, DarProfileInput, DarProfileRow, functionList (+8 more)

### Community 24 - "notifications-panel.tsx"
Cohesion: 0.14
Nodes (20): markAllTicketsRead(), Message(), Ctx, Data, Item, LIVE(), NavCount(), noChange() (+12 more)

### Community 25 - "tickets/page.tsx"
Cohesion: 0.06
Nodes (60): CardHead(), RecentTickets(), BoardCard, Card(), FilterSheet(), hrefWith(), metadata, MORE (+52 more)

### Community 26 - "uploads/storage.ts"
Cohesion: 0.18
Nodes (19): GET(), DELETE(), POST(), tickets, fail(), uploader(), POST(), isStoredName() (+11 more)

### Community 27 - "user-menu.tsx"
Cohesion: 0.22
Nodes (15): AccentDots(), AppearancePicker(), listeners, readAccent(), setAccent(), useAccent(), useThemeSwitch(), Appearance() (+7 more)

### Community 28 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, @base-ui/react, class-variance-authority, cn, lucide-react, next, next-themes, pg (+12 more)

### Community 29 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, dotenv, @electric-sql/pglite, eslint, eslint-config-next, fflate, pglite-prisma-adapter, @playwright/test (+11 more)

### Community 30 - "dar/import.ts"
Cohesion: 0.11
Nodes (34): read(), attr(), cellsOf(), clean(), columnIndex(), DarImport, DarImportError, decode() (+26 more)

### Community 31 - "shapes.ts"
Cohesion: 0.14
Nodes (26): onPointerMove(), drawSelection(), drawShape(), bounds(), calloutBox(), estimateWidth(), Handle, handlesOf() (+18 more)

### Community 32 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 33 - "files.ts"
Cohesion: 0.15
Nodes (23): body, tickets, checkUploaded(), cleanOriginalName(), EXT, FileType, mb(), newStoredName() (+15 more)

### Community 34 - "settings-bits.tsx"
Cohesion: 0.28
Nodes (6): MODES, Sheet(), SheetContent(), SheetDescription(), SheetHeader(), SheetTitle()

### Community 35 - "markup-editor.tsx"
Cohesion: 0.13
Nodes (25): desktopStageHeight(), Drag, Pinch, TextBox(), TextEdit, MarkupToolbar(), SHORTCUT_HELP, TOOL_BUTTONS (+17 more)

### Community 36 - "date-picker.tsx"
Cohesion: 0.32
Nodes (14): DatePicker(), moveTo(), onKeyDown(), pick(), addDays(), addMonths(), CalendarDay, isoDate() (+6 more)

### Community 37 - "Device notifications"
Cohesion: 0.13
Nodes (19): Device notifications (web push), Install as an app (Phase 3.7c), User.offHoursPush outside-hours choice, Filing tickets from a phone (Phase 3.7b), Service worker (public/sw.js), Share to QA Hub (Android share target), Sign out all devices, New ticket drafts (+11 more)

### Community 38 - "notifications.ts"
Cohesion: 0.15
Nodes (9): describeEvent(), inboxStore(), LastEvent, previewOf(), scopeSql(), UnreadItem, unreadSql(), scopeWhere() (+1 more)

### Community 39 - "tickets/actions.ts"
Cohesion: 0.31
Nodes (15): addComment(), assignTicket(), categorizeTicket(), createTicket(), editTicket(), fields(), moveTicket(), notifications (+7 more)

### Community 40 - "markup.test.ts"
Cohesion: 0.20
Nodes (17): exportImage(), saveImage(), encodeCanvas(), Encoded, shrinkImage(), toBlob(), baseName(), CONVERT_ABOVE_BYTES (+9 more)

### Community 41 - "shapes.ts"
Cohesion: 0.22
Nodes (8): arrowLine(), arrowHead(), DEFAULT_TEXT_SIZE, drawOrder(), drawOrderIndexes(), Rect, RectShape, TOOLS

### Community 42 - "workflow.ts"
Cohesion: 0.08
Nodes (43): boardCard(), Tone, Ticket detail: `tickets/[number]/page.tsx`, `Ticket.dc.html`, can(), BOARD_COLUMNS, columnInView(), movesInto(), allowedTransitions() (+35 more)

### Community 43 - "users/page.tsx"
Cohesion: 0.10
Nodes (29): approveSignUp(), deleteUser(), deletion, deletionPreview(), dismissResetRequest(), rejectSignUp(), resetPassword(), signOutAllDevices() (+21 more)

### Community 44 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 45 - "shared-files.ts"
Cohesion: 0.18
Nodes (13): SignOutRow(), PwaSetup(), showBadge(), removeAllDrafts(), dropAllSharedFiles(), dropOldSharedFiles(), SHARED_AT_HEADER, SHARED_CACHE (+5 more)

### Community 46 - "app/layout.tsx"
Cohesion: 0.15
Nodes (14): geistMono, geistSans, metadata, RootLayout(), viewport, AppSplash(), ResetSplash(), STEPS (+6 more)

### Community 47 - "requireUser"
Cohesion: 0.19
Nodes (15): myTone(), pushStatus(), savePreviews(), saveTone(), ToneCard(), save(), PushPrompt(), notNow() (+7 more)

### Community 48 - "QA Hub Changelog"
Cohesion: 0.15
Nodes (17): Phase 2 AI layer (removed workbench), Tickets Board view, QA Hub Changelog, DAR on long bond paper, My DAR for everyone, own details, My DAR first period and rolling periods, Phase 3.5a QA Hub foundation, Move a ticket back a step (+9 more)

### Community 49 - "view.ts"
Cohesion: 0.23
Nodes (11): ImageGallery(), zoomTo(), clampViewerZoom(), MAX_CANVAS_PX, offset(), Size, stepZoom(), Vec (+3 more)

### Community 50 - "ticket-view.tsx"
Cohesion: 0.07
Nodes (49): RequestList(), ThreadRow(), galleryImages(), Thread(), StepTip(), AssignControl(), CategoryControl(), CommentForm() (+41 more)

### Community 51 - "scripts"
Cohesion: 0.12
Nodes (17): scripts, areas:import, backup, build, db:deploy, db:generate, db:migrate, db:seed (+9 more)

### Community 52 - "avatar-upload.tsx"
Cohesion: 0.29
Nodes (11): Person(), toAvatarFile(), UserAvatar(), AVATAR_COLORS, AVATAR_PX, AVATAR_SOURCE_MAX_BYTES, avatarColors(), AvatarPerson (+3 more)

### Community 53 - "ticketStore"
Cohesion: 0.21
Nodes (14): areaPath(), manilaDay(), readWhere(), TicketError, ticketStore(), areaLabel(), assigneeName(), claimUploads() (+6 more)

### Community 54 - "package.json"
Cohesion: 0.09
Nodes (21): name, private, version, dotenv, pg, pglite-prisma-adapter, @playwright/test, prisma (+13 more)

### Community 55 - "dcwd_apps-csms-bca-api"
Cohesion: 0.16
Nodes (14): API.Cloud Host, API On-Premise Host, dcwd_apps-csms-bca-api, BCS, BCS Export Queue, CloudDataContext, DataContext, Meter-Reading Field-to-Bill Workflow (+6 more)

### Community 56 - "dar-sheet.tsx"
Cohesion: 0.14
Nodes (21): DarSheet(), focusCell(), FONT, FunctionRows(), SectionHead(), dar, GET(), CELL_MAX (+13 more)

### Community 57 - "QA AI for In-House ERP Build Plan"
Cohesion: 0.21
Nodes (13): Cloud Move to Vercel + Supabase, My DAR (Daily Accomplishment Report), Phase 3.10 UI Polish, Phase 3.5 QA Ticket Hub, Phase 3.6a Test Library and Manual Runs, Phase 3.7 QA Hub on Phones, Phase 3.7a Mobile UI Rework, Phase 3.7b Filing from the Phone (+5 more)

### Community 58 - "Phase 6 Business-Process Suites"
Cohesion: 0.18
Nodes (12): GL (General Ledger), Gross-to-Net, OR (Official Receipt), Oracle, Recon Check, 3-Way Match, Hire-to-Retire / Time-to-Pay Process, Meter-to-Cash Process (+4 more)

### Community 59 - "UI (Web) Rework: developer handoff"
Cohesion: 0.07
Nodes (26): 10. States and interactions, 11. Motion, 12. Edge cases and limits, 13. Done means, 2. Suggested build order, 3. Sizes and layout, 4. Design tokens, 6. Pages (+18 more)

### Community 60 - "getCurrentUser"
Cohesion: 0.24
Nodes (8): GET(), notifications, AccountBody(), GET, missed(), POST, auth, getCurrentUser

### Community 61 - "QA Hub product brief"
Cohesion: 0.20
Nodes (8): Own accounts with admin-approved sign-ups, Nightly npm run backup on the QA laptop, Permissions matrix in lib/auth/permissions.ts, proxy.ts optimistic redirect, Daily Accomplishment Report in 15-day periods, QA Hub product brief, Roles: Admin, QA tester, Developer, Who's-who directory of module owners

### Community 62 - "Account management"
Cohesion: 0.20
Nodes (8): Delete user, Designer tick-box (FLAG_GRANTS), Deleting an account, Account management, Design reviews, Designer flag, Failed sign-in lock-out, Password reset requests

### Community 63 - "ticket-peek.tsx"
Cohesion: 0.21
Nodes (13): PeekHeading(), PeekLink(), TicketPeek(), Check, CloseGuardContext, CloseGuardProvider, GuardRef, SheetClose() (+5 more)

### Community 64 - "Billing and Collection Process"
Cohesion: 0.22
Nodes (10): BAM and Debit/Credit Memos, Billing and Collection Process, JMS Service-Job Workflow, MCR Control Flow, Order of Payment, BAM (Billing Adjustment Memo), JMS (Job Management System), MCR (Customer Record Change) (+2 more)

### Community 65 - "image-picker.tsx"
Cohesion: 0.14
Nodes (26): dropFile(), removeAvatar(), saveAvatar(), cameraInputId(), captureFrame(), ImagePicker(), Item, Queued (+18 more)

### Community 66 - "Learning Log"
Cohesion: 0.25
Nodes (8): Additive migration first, code second, Cron job and CRON_SECRET, Learning Log, Magic bytes file type detection, Signed URL, SSRF host allow-list, Vercel env vars are read at build time, Daily clean-up GET /api/cron/daily

### Community 67 - "device-push.ts"
Cohesion: 0.18
Nodes (17): removePushSubscription(), sendTestPush(), currentSubscription(), deviceState, turnOffDevice(), turnOnDevice(), readDevice(), DeviceNotificationsCard() (+9 more)

### Community 68 - "QA Hub project rules"
Cohesion: 0.25
Nodes (6): Private attachments bucket, QA Hub project rules, Supabase Postgres and Storage (ap-southeast-1), Vercel hosting (sin1), Local setup steps, QA Hub README

### Community 69 - "Prisma 7 client via lib/db-client.ts"
Cohesion: 0.38
Nodes (5): Connection string and pooler, RLS with no policies denies the public API, DATABASE_URL transaction pooler, DIRECT_URL session pooler, Prisma 7 client via lib/db-client.ts

### Community 70 - "ticket-tabs.tsx"
Cohesion: 0.23
Nodes (9): ActiveTab, tabId(), TABS, TicketTab, TicketTabs(), onKeyDown(), onTouchEnd(), pick() (+1 more)

### Community 71 - "QA Hub moves to Vercel + Supabase"
Cohesion: 0.29
Nodes (4): lib/backup.ts backup and restore, QA Hub moves to Vercel + Supabase, Daily clean-up cron (changelog), Profile photo and per-person colours

### Community 72 - "sw.js"
Cohesion: 0.43
Nodes (4): askToPlay(), playInATab(), qaHubTabs(), refreshTabs()

### Community 73 - "interface"
Cohesion: 0.33
Nodes (5): interface, display_name, short_description, policy, allow_implicit_invocation

### Community 74 - "Notifications"
Cohesion: 0.33
Nodes (5): My inbox, Notification bell, Notifications, Mark up screenshot tools, Sidebar counts

### Community 75 - "tree.ts"
Cohesion: 0.19
Nodes (10): metadata, NewTicket(), reporterOptions(), ticketFormOptions(), AreaSelect(), AreaTree, buildTree(), byOrder() (+2 more)

### Community 76 - "PushPrompt"
Cohesion: 0.47
Nodes (5): changed(), InstallEvent, listeners, subscribe(), useInstallPrompt()

### Community 77 - "Web Push service worker and subscription"
Cohesion: 0.40
Nodes (3): VAPID keys, Web Push service worker and subscription, Installable app with push notifications

### Community 78 - "grilling skill (.claude)"
Cohesion: 0.40
Nodes (4): grill-me skill (.claude), Design tree (.claude), Decision frontier (.claude), grilling skill (.claude)

### Community 79 - "Stack: Next.js 16, React 19, TypeScript, Tailwind 4"
Cohesion: 0.40
Nodes (4): Next.js agent feedback pass, Next.js agent rules, Stack: Next.js 16, React 19, TypeScript, Tailwind 4, Vitest on PGlite

### Community 80 - "video-upload.test.ts"
Cohesion: 0.19
Nodes (18): VIDEO_MAX_SECONDS, bufferReader(), mp4Duration(), mvhdDuration(), ReadAt, videoDuration(), vint(), walk() (+10 more)

### Community 81 - "Hard rule: uploads use generated names and post-upload checks"
Cohesion: 0.50
Nodes (3): Avatar route app/(main)/files/avatar/[userId], File route app/(main)/files/[id], Session guards in lib/auth/session.ts

### Community 83 - "Grabber"
Cohesion: 0.70
Nodes (5): Grabber(), onPointerDown(), onPointerMove(), onPointerUp(), sheet()

### Community 84 - "My DAR (Daily Accomplishment Report)"
Cohesion: 0.40
Nodes (4): My DAR set-up, Module codes, My DAR (Daily Accomplishment Report), Team & modules

### Community 85 - "ticket-form.tsx"
Cohesion: 0.12
Nodes (32): FunctionsEditor(), DarSetupForm(), AssignForm(), DeleteTicketDialog(), MoveForm(), NOTE_HINTS, Ref, AreaOption (+24 more)

### Community 86 - "next"
Cohesion: 0.10
Nodes (22): TABS, AccountTab, ALIASES, PeriodOption, BAR, INK, ModuleProgressCard(), scoreText() (+14 more)

### Community 87 - "interface"
Cohesion: 0.50
Nodes (3): interface, display_name, short_description

### Community 88 - "Hide tool (solid black box)"
Cohesion: 0.50
Nodes (3): My inbox, Messenger-style, Notification bell and TicketRead, Screenshot markup editor

### Community 89 - "DCWD CSMS BCA API Process Flow"
Cohesion: 0.67
Nodes (3): Recommended Operating Model, DCWD CSMS BCA API Process Flow, ERP Glossary

### Community 90 - "report.ts"
Cohesion: 0.11
Nodes (31): GET(), tickets, counts(), fairScore(), LEFT_OUT, memberModules(), moduleProgress, percent() (+23 more)

### Community 92 - "vercel.json"
Cohesion: 0.50
Nodes (3): crons, regions, $schema

### Community 101 - "inbox/page.tsx"
Cohesion: 0.16
Nodes (14): hrefWith(), inbox, metadata, Params, parse(), tickets, markTicketRead(), closeDeviceNotifications() (+6 more)

### Community 102 - "team/actions.ts"
Cohesion: 0.23
Nodes (13): deleteArea(), duplicateCode(), saveArea(), saveAreaMembers(), AreaForm(), MembersForm(), AreaNode, nextSortOrder() (+5 more)

### Community 103 - "shell.js"
Cohesion: 0.27
Nodes (10): apply(), closeMenu(), fillPanel(), hideTip(), icon(), markAllRead(), openMenu(), setPanel() (+2 more)

### Community 104 - "account/page.tsx"
Cohesion: 0.11
Nodes (16): AccountTabs(), onKeyDown(), pick(), metadata, WAVES, metadata, AppearanceRow(), RequestsCount() (+8 more)

### Community 105 - "users-filter.test.ts"
Cohesion: 0.24
Nodes (9): one(), UsersBody(), FilterableUser, filterUsers(), STATUS_LABELS, UserFilters, userStatus, names() (+1 more)

### Community 106 - "user-menu.tsx"
Cohesion: 0.58
Nodes (5): logout(), Tooltip(), TooltipContent(), TooltipTrigger(), UserMenu()

### Community 107 - "(main)/layout.tsx"
Cohesion: 0.15
Nodes (13): SessionBottomNav(), SessionSidebar(), SessionTopbar(), sessionUser(), AppSidebar(), AppSidebarShell(), SidebarUser, NotificationsPanelProvider() (+5 more)

### Community 108 - "signup-form.tsx"
Cohesion: 0.17
Nodes (12): ROLE_CARDS, email, EMAIL_DOMAIN, forgotInput, loginInput, nickname, NICKNAME_MAX, PASSWORD_MIN (+4 more)

### Community 110 - "TicketStatus"
Cohesion: 0.22
Nodes (12): StatusMoves(), FORWARD, isForward(), isRedMove(), MoveLayout, moveLayout(), RED, TicketStatus (+4 more)

### Community 111 - "session.ts"
Cohesion: 0.17
Nodes (16): ClaimState, login(), SignupState, SESSION_COOKIE, SESSION_MAX_AGE_S, sessionCookieOptions(), safeNext(), loginLimiter (+8 more)

### Community 112 - "How tickets connect to Module progress"
Cohesion: 0.20
Nodes (9): Boards, Build rules, How tickets connect to Module progress, New features, Still to check, The calculation, UI (Web) Rework: design notes, What changes the numbers (+1 more)

### Community 117 - "log.ts"
Cohesion: 0.23
Nodes (11): buildActivityLog(), describeFiles(), LogEntry, LogInput, plural(), status(), STATUS_LABELS, ana (+3 more)

### Community 118 - "lib/backup.ts"
Cohesion: 0.26
Nodes (10): areaLevels(), ownDarDetails(), parseSnapshot(), restoreSnapshot(), Snapshot, SNAPSHOT_TABLES, SNAPSHOT_VERSION, SnapshotTable (+2 more)

### Community 119 - "hitTest"
Cohesion: 0.24
Nodes (11): commitEdit(), onDoubleClick(), onPointerDown(), onPointerUp(), placeText(), retype(), distToSegment(), handleAt() (+3 more)

### Community 120 - "tones.ts"
Cohesion: 0.29
Nodes (7): playTone(), ToneSelect(), ToneListener(), DEFAULT_TONE, PRESET_TONES, ToneId, toneSrc()

### Community 121 - "notifications-card.tsx"
Cohesion: 0.47
Nodes (7): saveWorkHours(), DAYS, OFF_HOURS, WorkHoursCard(), ampm(), hhmm(), timeOptions()

### Community 122 - "holidays.ts"
Cohesion: 0.52
Nodes (6): easter(), FIXED, holidayOn(), iso(), moving(), pad()

### Community 123 - "dar-migration.test.ts"
Cohesion: 0.29
Nodes (4): LEGACY_TEMPLATE, @electric-sql/pglite, dir, Row

### Community 124 - "reset-password.ts"
Cohesion: 0.47
Nodes (5): claimTempPassword(), generateTempPassword(), normalizeEmail(), main(), { values }

### Community 125 - "allowScripts"
Cohesion: 0.40
Nodes (5): allowScripts, esbuild@0.28.2, prisma@7.10.1, @prisma/engines@7.10.1, unrs-resolver@1.12.2

### Community 126 - "badge.tsx"
Cohesion: 0.67
Nodes (3): Badge(), badgeVariants, class-variance-authority

### Community 127 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

### Community 128 - "zod"
Cohesion: 0.50
Nodes (3): id, optionalText(), zod

## Knowledge Gaps
- **76 isolated node(s):** `pg`, `@playwright/test`, `@prisma/client`, `shadcn`, `tailwindcss` (+71 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 658 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Account management` connect `Account management` to `Environment variables`, `reset-password.ts`, `Device notifications`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `MarkupEditor()` (e.g. with `zoomTo()` and `redo()`) actually correct?**
  _`MarkupEditor()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `pg`, `@playwright/test`, `@prisma/client` to the rest of the system?**
  _76 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `lib/backup.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12477718360071301 - nodes in this community are weakly interconnected._
- **Why does `react` connect `lucide-react` to `login/page.tsx`, `format.ts`, `draft.ts`, `(main)/page.tsx`, `sidebar.tsx`, `team/page.tsx`, `nav.ts`, `period.ts`, `board.tsx`, `image-picker.tsx`, `setup/page.tsx`, `notifications-panel.tsx`, `tickets/page.tsx`, `user-menu.tsx`, `settings-bits.tsx`, `markup-editor.tsx`, `date-picker.tsx`, `users/page.tsx`, `shared-files.ts`, `app/layout.tsx`, `requireUser`, `ticket-view.tsx`, `avatar-upload.tsx`, `package.json`, `dar-sheet.tsx`, `ticket-peek.tsx`, `image-picker.tsx`, `ticket-tabs.tsx`, `tree.ts`, `PushPrompt`, `ticket-form.tsx`, `next`, `inbox/page.tsx`, `account/page.tsx`, `user-menu.tsx`, `(main)/layout.tsx`, `signup-form.tsx`, `table.tsx`, `session.ts`, `tones.ts`, `notifications-card.tsx`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Should `format.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10483870967741936 - nodes in this community are weakly interconnected._
- **Why does `Lost phone procedure` connect `Device notifications` to `Account management`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._