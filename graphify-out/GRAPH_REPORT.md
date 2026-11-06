# Graph Report - Quality-ai  (2026-11-06)

## Corpus Check
- 325 files · ~216,133 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .example 1)

## Summary
- 2294 nodes · 6641 edges · 137 communities (108 shown, 29 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 180 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `edd718a7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- lucide-react
- login/page.tsx
- lib/backup.ts
- format.ts
- tickets/actions.ts
- (main)/page.tsx
- skeletons.tsx
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
- Button
- markup.test.ts
- shapes.ts
- workflow.ts
- users/actions.ts
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
- progress.ts
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
- react
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
- module-progress.tsx
- shell.js
- account/page.tsx
- users-filter.test.ts
- (main)/layout.tsx
- TicketStatus
- session.ts
- log.ts
- lib/backup.ts
- hitTest
- tones.ts
- notifications-card.tsx
- holidays.ts
- allowScripts
- badge.tsx
- eslint.config.mjs

## God Nodes (most connected - your core abstractions)
1. `react` - 87 edges
2. `lucide-react` - 67 edges
3. `Button()` - 60 edges
4. `MarkupEditor()` - 59 edges
5. `next` - 59 edges
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

## Communities (137 total, 29 thin omitted)

### Community 0 - "lucide-react"
Cohesion: 0.13
Nodes (33): resetPassword(), UserFormState, ApprovalContext, Open, SignUpRequest, copyText(), ResetPasswordButton(), TempPassword() (+25 more)

### Community 1 - "login/page.tsx"
Cohesion: 0.12
Nodes (21): claimTempPassword(), signupStatus(), AuthTabs(), TABS, ClaimCard(), ForgotForm(), LoginForm(), BrandPane() (+13 more)

### Community 2 - "lib/backup.ts"
Cohesion: 0.13
Nodes (21): manifest(), importAreas(), generateTempPassword(), snapshotFiles(), takeSnapshot(), createClient(), getClient(), globalForPrisma (+13 more)

### Community 3 - "format.ts"
Cohesion: 0.10
Nodes (26): Attachments(), Evidence(), FileRow, Item, GalleryImage, show(), ImageThumb(), connectionType() (+18 more)

### Community 4 - "tickets/actions.ts"
Cohesion: 0.05
Nodes (76): emailError(), requestPasswordReset(), signup(), createUser(), duplicateEmail(), updateUser(), UserForm(), dar (+68 more)

### Community 5 - "(main)/page.tsx"
Cohesion: 0.14
Nodes (25): ModuleProgressSection(), adminHome(), Counts, DashboardPage(), firstName(), ICON_BOX, MainAndSide(), Me (+17 more)

### Community 6 - "skeletons.tsx"
Cohesion: 0.16
Nodes (14): metadata, TicketPage(), TicketPeekPage(), AccountSkeleton(), DarSkeleton(), FormSkeleton(), InboxSkeleton(), ListRows() (+6 more)

### Community 7 - "permissions.ts"
Cohesion: 0.15
Nodes (19): derive(), dummyPasswordHash(), hashPassword(), verifyPassword(), Action, ACTIONS, Flag, FLAG_GRANTS (+11 more)

### Community 8 - "sidebar.tsx"
Cohesion: 0.09
Nodes (29): logout(), brandText, fadeText, groupLabel, navButton, Separator(), Sidebar(), SidebarContent() (+21 more)

### Community 9 - "team/page.tsx"
Cohesion: 0.13
Nodes (18): ModuleLink, ModuleList(), Member, metadata, SearchParams, TeamBody(), teamHref(), AreaDialog() (+10 more)

### Community 10 - "20261030000000_init_postgres/migration.sql"
Cohesion: 0.09
Nodes (39): "AreaMember", AreaMember_areaId_idx, "Attachment", Attachment_storedName_key, Attachment_ticketId_idx, "DarProfile", "DarReport", DarReport_userId_periodStart_key (+31 more)

### Community 11 - "vitest"
Cohesion: 0.11
Nodes (18): GET(), AreaFile, code, ImportReport, Row, subArea, createRateLimiter(), RATE_LIMIT_KEEP_MS (+10 more)

### Community 12 - "tickets/store.ts"
Cohesion: 0.06
Nodes (33): categoryInput, commentInput, emptyToNull, param, TICKET_GROUPS, ticketCreate, TicketCreate, ticketEdit (+25 more)

### Community 13 - "nav.ts"
Cohesion: 0.11
Nodes (33): focusSoon(), SidebarView(), AppTopbar(), AppTopbarShell(), BackButton(), PhoneNav, TopbarView(), BottomNav() (+25 more)

### Community 14 - "period.ts"
Cohesion: 0.14
Nodes (35): dar, DarBody(), DarPage(), metadata, FirstPeriodField(), addDays(), DOWS, firstPeriodOf() (+27 more)

### Community 15 - "board.tsx"
Cohesion: 0.10
Nodes (26): BoardColumnData, ColumnTabs(), Pending, stillPending(), Task, TaskDialog(), TicketBoard(), without() (+18 more)

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
Cohesion: 0.09
Nodes (35): avatars, push, savePushSubscription(), deviceLabel(), clip(), PushEvent, pushMessage, PushTicket (+27 more)

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
Cohesion: 0.12
Nodes (23): markAllTicketsRead(), Message(), Ctx, Data, Item, LIVE(), NavCount(), noChange() (+15 more)

### Community 25 - "tickets/page.tsx"
Cohesion: 0.06
Nodes (60): CardHead(), RecentTickets(), BoardCard, Card(), FilterSheet(), hrefWith(), metadata, MORE (+52 more)

### Community 26 - "uploads/storage.ts"
Cohesion: 0.18
Nodes (19): GET(), DELETE(), POST(), tickets, fail(), uploader(), POST(), isStoredName() (+11 more)

### Community 27 - "user-menu.tsx"
Cohesion: 0.21
Nodes (15): AppearancePicker(), MODES, listeners, readAccent(), setAccent(), useAccent(), useThemeSwitch(), Appearance() (+7 more)

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
Cohesion: 0.32
Nodes (5): Sheet(), SheetContent(), SheetDescription(), SheetHeader(), SheetTitle()

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
Cohesion: 0.16
Nodes (10): describeEvent(), inboxStore(), LastEvent, previewOf(), notificationStore(), scopeSql(), UnreadItem, unreadSql() (+2 more)

### Community 39 - "Button"
Cohesion: 0.23
Nodes (8): FunctionsEditor(), AccentPicker(), ThemeToggle(), Button(), buttonVariants, Textarea(), @base-ui/react, cn

### Community 40 - "markup.test.ts"
Cohesion: 0.20
Nodes (17): exportImage(), saveImage(), encodeCanvas(), Encoded, shrinkImage(), toBlob(), baseName(), CONVERT_ABOVE_BYTES (+9 more)

### Community 41 - "shapes.ts"
Cohesion: 0.22
Nodes (8): arrowLine(), arrowHead(), DEFAULT_TEXT_SIZE, drawOrder(), drawOrderIndexes(), Rect, RectShape, TOOLS

### Community 42 - "workflow.ts"
Cohesion: 0.08
Nodes (43): boardCard(), Tone, Ticket detail: `tickets/[number]/page.tsx`, `Ticket.dc.html`, can(), BOARD_COLUMNS, columnInView(), movesInto(), allowedTransitions() (+35 more)

### Community 43 - "users/actions.ts"
Cohesion: 0.09
Nodes (24): approveSignUp(), deleteUser(), deletion, deletionPreview(), dismissResetRequest(), rejectSignUp(), signOutAllDevices(), DeleteUserDialog() (+16 more)

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

### Community 60 - "progress.ts"
Cohesion: 0.23
Nodes (14): counts(), fairScore(), LEFT_OUT, memberModules(), moduleProgress, percent(), Progress, ProgressArea (+6 more)

### Community 61 - "QA Hub product brief"
Cohesion: 0.20
Nodes (8): Own accounts with admin-approved sign-ups, Nightly npm run backup on the QA laptop, Permissions matrix in lib/auth/permissions.ts, proxy.ts optimistic redirect, Daily Accomplishment Report in 15-day periods, QA Hub product brief, Roles: Admin, QA tester, Developer, Who's-who directory of module owners

### Community 62 - "Account management"
Cohesion: 0.20
Nodes (8): Delete user, Designer tick-box (FLAG_GRANTS), Deleting an account, Account management, Design reviews, Designer flag, Failed sign-in lock-out, Password reset requests

### Community 63 - "ticket-peek.tsx"
Cohesion: 0.32
Nodes (9): PeekHeading(), PeekLink(), TicketPeek(), SheetClose(), opensPeek(), PeekClick, peekHref(), TICKET_TITLE_ID (+1 more)

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

### Community 85 - "react"
Cohesion: 0.26
Nodes (15): ROLE_CARDS, PeriodOption, DarSetupForm(), Field(), FormMessage(), FormSection(), IconField(), PasswordInput() (+7 more)

### Community 86 - "next"
Cohesion: 0.10
Nodes (18): AccountTab, ALIASES, metadata, RequestRow, STATUS_TONE, Tab, TABS, PendingActions() (+10 more)

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
Cohesion: 0.17
Nodes (17): GET(), tickets, progressTone, add(), bar(), emptyStages(), esc(), ModuleReport (+9 more)

### Community 92 - "vercel.json"
Cohesion: 0.50
Nodes (3): crons, regions, $schema

### Community 101 - "inbox/page.tsx"
Cohesion: 0.16
Nodes (14): hrefWith(), inbox, metadata, Params, parse(), tickets, markTicketRead(), closeDeviceNotifications() (+6 more)

### Community 102 - "module-progress.tsx"
Cohesion: 0.29
Nodes (8): BAR, INK, ModuleProgressCard(), scoreText(), ModuleScope(), ScoreDot(), SelectOption, MIN_TICKETS

### Community 103 - "shell.js"
Cohesion: 0.27
Nodes (10): apply(), closeMenu(), fillPanel(), hideTip(), icon(), markAllRead(), openMenu(), setPanel() (+2 more)

### Community 104 - "account/page.tsx"
Cohesion: 0.11
Nodes (16): AccountTabs(), onKeyDown(), pick(), metadata, WAVES, metadata, AppearanceRow(), RequestsCount() (+8 more)

### Community 105 - "users-filter.test.ts"
Cohesion: 0.24
Nodes (9): one(), UsersBody(), FilterableUser, filterUsers(), STATUS_LABELS, UserFilters, userStatus, names() (+1 more)

### Community 107 - "(main)/layout.tsx"
Cohesion: 0.17
Nodes (12): SessionBottomNav(), SessionSidebar(), SessionTopbar(), sessionUser(), AppSidebar(), AppSidebarShell(), SidebarUser, SidebarInset() (+4 more)

### Community 110 - "TicketStatus"
Cohesion: 0.22
Nodes (12): StatusMoves(), FORWARD, isForward(), isRedMove(), MoveLayout, moveLayout(), RED, TicketStatus (+4 more)

### Community 111 - "session.ts"
Cohesion: 0.09
Nodes (30): GET(), notifications, ClaimState, login(), SignupState, changePassword(), AccountBody(), PasswordForm() (+22 more)

### Community 117 - "log.ts"
Cohesion: 0.23
Nodes (11): buildActivityLog(), describeFiles(), LogEntry, LogInput, plural(), status(), STATUS_LABELS, ana (+3 more)

### Community 118 - "lib/backup.ts"
Cohesion: 0.14
Nodes (14): areaLevels(), ownDarDetails(), parseSnapshot(), restoreSnapshot(), Snapshot, SNAPSHOT_TABLES, SNAPSHOT_VERSION, SnapshotTable (+6 more)

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

### Community 125 - "allowScripts"
Cohesion: 0.40
Nodes (5): allowScripts, esbuild@0.28.2, prisma@7.10.1, @prisma/engines@7.10.1, unrs-resolver@1.12.2

### Community 126 - "badge.tsx"
Cohesion: 0.67
Nodes (3): Badge(), badgeVariants, class-variance-authority

### Community 127 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

## Knowledge Gaps
- **76 isolated node(s):** `pg`, `@playwright/test`, `@prisma/client`, `shadcn`, `tailwindcss` (+71 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 658 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Account management` connect `Account management` to `lib/backup.ts`, `Environment variables`, `Device notifications`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `MarkupEditor()` (e.g. with `zoomTo()` and `redo()`) actually correct?**
  _`MarkupEditor()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `pg`, `@playwright/test`, `@prisma/client` to the rest of the system?**
  _76 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `lucide-react` be split into smaller, more focused modules?**
  _Cohesion score 0.1341350601295097 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `vitest` to `lib/backup.ts`, `tickets/actions.ts`, `(main)/page.tsx`, `permissions.ts`, `team/page.tsx`, `tickets/store.ts`, `nav.ts`, `period.ts`, `dar/store.ts`, `account/actions.ts`, `MarkupEditor`, `template.ts`, `tickets/page.tsx`, `user-menu.tsx`, `dar/import.ts`, `shapes.ts`, `files.ts`, `date-picker.tsx`, `notifications.ts`, `workflow.ts`, `users/actions.ts`, `shared-files.ts`, `ticket-view.tsx`, `package.json`, `progress.ts`, `ticket-peek.tsx`, `device-push.ts`, `ticket-tabs.tsx`, `tree.ts`, `video-upload.test.ts`, `report.ts`, `users-filter.test.ts`, `TicketStatus`, `log.ts`, `lib/backup.ts`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Should `login/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12307692307692308 - nodes in this community are weakly interconnected._
- **Why does `Lost phone procedure` connect `Device notifications` to `Account management`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._