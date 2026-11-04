# Graph Report - Quality-ai  (2026-11-04)

## Corpus Check
- 276 files · ~145,711 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .graphify-bak 1, .example 1)

## Summary
- 1953 nodes · 6085 edges · 112 communities (91 shown, 21 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 116 edges (avg confidence: 0.86)
- Token cost: 84,699 input · 0 output

## Community Hubs (Navigation)
- Buttons and Action Dialogs
- Session and Server Actions
- Auth Store and Backup
- Ticket Detail and Inbox
- Ticket Form and Drafts
- Dashboard and Shared Helpers
- Form Field Components
- Database Tables and Migrations
- Sidebar Navigation
- Team and User Lists
- Page Headers and Setup
- Test Database Harness
- Ticket Store and Schema
- Topbar and Nav Rules
- DAR Periods and Page
- Ticket Workflow Rules
- DAR Store and Autofill
- DAR Editor and HTML Sheet
- Operations and Setup Guide
- Push Notification Sending
- Attachment Pickers
- Markup Editor Interaction
- Account Page and Cards
- DAR Template and Functions
- Main Layout and Tones
- Ticket Board Page
- Upload Storage and Routes
- Theme and User Menu
- Runtime Dependencies
- Dev Dependencies
- Video and Attachment Upload
- Markup Geometry
- shadcn Components Config
- Upload File Checks
- Settings Page and Sheets
- Markup Toolbar and History
- Date Picker and Calendar
- Device Notification Docs
- Inbox and Notification Store
- Video Length Checks
- Markup Image Export
- Markup Drawing
- Ticket Board Columns
- Push Subscriptions and Tones
- TypeScript Config
- App Install State
- Root Layout and Splash
- Account Server Actions
- Changelog Phases and Workflow
- Markup View and Zoom
- Ticket Progress Flow
- npm Scripts
- Profile Avatars
- Ticket Scope and File Route
- Package Dependencies
- ERP Billing API Pipeline
- DAR Excel Export
- QA Hub Roadmap Phases
- Business Process Test Suites
- Ticket Activity Log
- Avatar and Share Routes
- Product Brief and Access Rules
- Account Administration Docs
- Markup Shape Helpers
- Billing and Job Processes
- Image Attachment Hook
- Learning Log
- Device Notifications Card
- Project Rules and Hosting
- Database Connection Rules
- Ticket Tabs and Swipe
- Changelog Early Phases
- Service Worker
- Grill-me Config (.claude)
- Notifications and Markup Docs
- ESLint Config
- Install Prompt Hook
- Installable App and Push
- Grilling Skills
- Stack and Agent Rules
- Mark Ticket Read
- Upload and Session Rules
- Ticket Data Privacy Rule
- Sheet Grabber Gesture
- My DAR Docs
- Allowed Install Scripts
- Env and Prisma Config
- Grilling Config (.claude)
- Markup and Inbox Docs
- BCA API Operating Model
- Keyboard Open Hook
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

## God Nodes (most connected - your core abstractions)
1. `Button()` - 87 edges
2. `react` - 74 edges
3. `MarkupEditor()` - 59 edges
4. `lucide-react` - 58 edges
5. `next` - 51 edges
6. `requireAction()` - 44 edges
7. `vitest` - 39 edges
8. `TicketView()` - 38 edges
9. `TicketList()` - 36 edges
10. `can()` - 33 edges

## Surprising Connections (you probably didn't know these)
- `RLS with no policies denies the public API` --semantically_similar_to--> `Hard rule: RLS on for every table with no policies`  [INFERRED] [semantically similar]
  .claude/LEARNING.md → CLAUDE.md
- `MarkupEditor()` --indirect_call--> `redo()`  [INFERRED]
  app/(main)/tickets/markup/markup-editor.tsx → lib/markup/history.ts
- `MarkupEditor()` --indirect_call--> `undo()`  [INFERRED]
  app/(main)/tickets/markup/markup-editor.tsx → lib/markup/history.ts
- `onKeyDown()` --indirect_call--> `redo()`  [INFERRED]
  app/(main)/tickets/markup/markup-editor.tsx → lib/markup/history.ts
- `UserMenu()` --indirect_call--> `logout()`  [INFERRED]
  components/user-menu.tsx → app/login/actions.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Protected file upload and serving flow** — claude_rule_uploads, claude_attachments_bucket, claude_files_route, claude_avatar_route, claude_session_guards [EXTRACTED 1.00]
- **Access control layers behind login** — claude_session_guards, claude_proxy_optimistic_redirect, claude_permissions_matrix, claude_admin_approved_accounts [EXTRACTED 1.00]
- **Customer data protection measures** — claude_rule_no_llm_ticket_data, claude_supabase_mcp_read_only, claude_rule_rls_on, product_principle_protect_customer_data, product_made_up_sample_content [INFERRED 0.85]
- **Ticket status lifecycle surfaces** — docs_changelog_ticket_workflow, docs_changelog_move_back_step, docs_changelog_board_view, docs_changelog_progress_tracker [INFERRED 0.85]
- **Four Business-Process Test Suites** — docs_plan_meter_to_cash, docs_plan_procure_to_pay, docs_plan_record_to_report, docs_plan_hire_to_retire, docs_plan_phase_6_process_suites [EXTRACTED 1.00]
- **Validate, Approve, Post Controls** — docs_erp_bca_api_process_flow_bam_memos, docs_erp_bca_api_process_flow_mcr, docs_glossary_bam, docs_glossary_mcr [INFERRED 0.85]
- **Disaster recovery flow** — docs_operations_nightly_backup, docs_operations_task_scheduler_job, docs_operations_restore_procedure, docs_operations_first_time_supabase_setup [EXTRACTED 1.00]
- **Customer data protection measures** — docs_operations_ticket_data_sensitivity, docs_operations_hide_tool, docs_operations_message_previews, docs_operations_nightly_backup, docs_operations_row_level_security [INFERRED 0.85]

## Communities (112 total, 21 thin omitted)

### Community 0 - "Buttons and Action Dialogs"
Cohesion: 0.07
Nodes (92): ToneSelect(), approveSignUp(), deleteUser(), deletion, deletionPreview(), dismissResetRequest(), rejectSignUp(), resetPassword() (+84 more)

### Community 1 - "Session and Server Actions"
Cohesion: 0.05
Nodes (78): emailError(), login(), logout(), requestPasswordReset(), signup(), changePassword(), saveWorkHours(), createUser() (+70 more)

### Community 2 - "Auth Store and Backup"
Cohesion: 0.07
Nodes (43): importAreas(), derive(), dummyPasswordHash(), generateTempPassword(), hashPassword(), verifyPassword(), Action, ACTIONS (+35 more)

### Community 3 - "Ticket Detail and Inbox"
Cohesion: 0.08
Nodes (55): hrefWith(), inbox, Inbox(), InboxPage(), metadata, Params, parse(), ThreadRow() (+47 more)

### Community 4 - "Ticket Form and Drafts"
Cohesion: 0.08
Nodes (43): DraftCleanup(), AreaSelect(), SharedFiles, storage(), TicketForm(), clearDraft(), TicketFormFields(), TicketFormProps (+35 more)

### Community 5 - "Dashboard and Shared Helpers"
Cohesion: 0.06
Nodes (35): TABS, AccountTab, AdminHome(), Counts, DashboardPage(), MODULES_TEXT, notifications, Overview() (+27 more)

### Community 6 - "Form Field Components"
Cohesion: 0.16
Nodes (31): AuthTabs(), ForgotForm(), LoginForm(), BrandPane(), BrandText(), CHIPS, LoginBody(), LoginPage() (+23 more)

### Community 7 - "Database Tables and Migrations"
Cohesion: 0.10
Nodes (38): "AreaMember", AreaMember_areaId_idx, "Attachment", Attachment_storedName_key, Attachment_ticketId_idx, "DarProfile", "DarReport", DarReport_userId_periodStart_key (+30 more)

### Community 8 - "Sidebar Navigation"
Cohesion: 0.09
Nodes (30): brandText, fadeText, groupLabel, navButton, SidebarView(), navGroups(), NavCount(), Separator() (+22 more)

### Community 9 - "Team and User Lists"
Cohesion: 0.12
Nodes (27): metadata, UsersBody(), UsersPage(), AreaRow(), Member, metadata, People(), SearchParams (+19 more)

### Community 10 - "Page Headers and Setup"
Cohesion: 0.13
Nodes (29): dar, DarSetupPage(), metadata, SetupBody(), metadata, SettingsPage(), rowClass, TILES (+21 more)

### Community 11 - "Test Database Harness"
Cohesion: 0.11
Nodes (18): GET(), areaFile, AreaFile, code, ImportReport, Row, subArea, createRateLimiter() (+10 more)

### Community 12 - "Ticket Store and Schema"
Cohesion: 0.08
Nodes (26): id, optionalText(), commentInput, emptyToNull, param, TICKET_GROUPS, ticketCreate, TicketCreate (+18 more)

### Community 13 - "Topbar and Nav Rules"
Cohesion: 0.12
Nodes (28): AppTopbar(), AppTopbarShell(), BackButton(), GROUP_LABEL, PhoneNav, TopbarView(), BottomNav(), ACCOUNT_SECTIONS (+20 more)

### Community 14 - "DAR Periods and Page"
Cohesion: 0.18
Nodes (26): dar, DarBody(), DarPage(), metadata, FirstPeriodField(), daysInMonth(), DOWS, firstPeriodOf() (+18 more)

### Community 15 - "Ticket Workflow Rules"
Cohesion: 0.11
Nodes (26): GET(), can(), allowedTransitions(), canDeleteTicket(), canEditTicket(), DEVICE_LABELS, devSide(), qaSide() (+18 more)

### Community 16 - "DAR Store and Autofill"
Cohesion: 0.17
Nodes (24): Activity, ActivityArea, areaLabel(), blankRow(), buildCells(), dayEntries(), daysAttended(), fitCells() (+16 more)

### Community 17 - "DAR Editor and HTML Sheet"
Cohesion: 0.13
Nodes (24): DarEditor(), download(), print(), refill(), save(), PeriodOption, DarSheet(), focusCell() (+16 more)

### Community 18 - "Operations and Setup Guide"
Cohesion: 0.12
Nodes (24): Storage bucket attachments, BACKUP_DIR, CRON_SECRET, Daily clean-up cron (/api/cron/daily), DATABASE_URL, Deployment flow, DIRECT_URL, .env.example (+16 more)

### Community 19 - "Push Notification Sending"
Cohesion: 0.14
Nodes (21): clip(), PushEvent, PushMessage, pushMessage(), PushTicket, TEST_MESSAGE, Candidate, Delivery (+13 more)

### Community 20 - "Attachment Pickers"
Cohesion: 0.15
Nodes (20): AttachMenu(), cameraInputId(), canCaptureScreen(), ImageAttachments, ImagePicker(), Item, Queued, useCanCapture() (+12 more)

### Community 21 - "Markup Editor Interaction"
Cohesion: 0.15
Nodes (26): hasText(), MarkupEditor(), applyFont(), bumpSize(), commitEdit(), movePinch(), onDoubleClick(), onFingerDown() (+18 more)

### Community 22 - "Account Page and Cards"
Cohesion: 0.26
Nodes (22): AccountTabs(), onKeyDown(), pick(), InstallCard(), DAYS, OFF_HOURS, ToneCard(), WorkHoursCard() (+14 more)

### Community 23 - "DAR Template and Functions"
Cohesion: 0.10
Nodes (16): DarUser, adoptLegacyTemplate(), darFunction, DarFunction, DarProfileInput, DarProfileRow, functionList, isEmptyJson() (+8 more)

### Community 24 - "Main Layout and Tones"
Cohesion: 0.16
Nodes (20): playTone(), MainLayout(), SessionBottomNav(), SessionSidebar(), SessionTopbar(), sessionUser(), RequestsCount(), ToneListener() (+12 more)

### Community 25 - "Ticket Board Page"
Cohesion: 0.14
Nodes (22): boardCard(), hrefWith(), metadata, MORE, NewTicketButton(), notifications, Quick, quick() (+14 more)

### Community 26 - "Upload Storage and Routes"
Cohesion: 0.21
Nodes (20): DELETE(), POST(), tickets, fail(), uploader(), body, POST(), tickets (+12 more)

### Community 27 - "Theme and User Menu"
Cohesion: 0.20
Nodes (17): SidebarUser, AppearancePicker(), MODES, listeners, readAccent(), setAccent(), useAccent(), Appearance() (+9 more)

### Community 28 - "Runtime Dependencies"
Cohesion: 0.08
Nodes (24): dependencies, @base-ui/react@^1.9.0, class-variance-authority@^0.7.1, cn@^0.5.0, lucide-react@^1.61.0, next@16.4.3, next-themes@^0.4.6, pg@^8.23.1 (+16 more)

### Community 29 - "Dev Dependencies"
Cohesion: 0.08
Nodes (24): devDependencies, @electric-sql/pglite@^0.4.3, pglite-prisma-adapter@^0.7.2, @playwright/test@^1.64.1, tailwindcss@^4, @tailwindcss/turbopack@^4, @types/node@^24.19.2, @types/pg@^8.23.1 (+16 more)

### Community 30 - "Video and Attachment Upload"
Cohesion: 0.19
Nodes (21): connectionType(), probeDuration(), Upload, useVideoUpload(), send(), start(), VideoPicker(), VideoUpload (+13 more)

### Community 31 - "Markup Geometry"
Cohesion: 0.17
Nodes (21): onPointerMove(), drawSelection(), bounds(), calloutBox(), distToSegment(), estimateWidth(), Handle, handlesOf() (+13 more)

### Community 32 - "shadcn Components Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 33 - "Upload File Checks"
Cohesion: 0.17
Nodes (20): checkUploaded(), cleanOriginalName(), EXT, FileType, mb(), newStoredName(), planUpload(), sniffImage() (+12 more)

### Community 34 - "Settings Page and Sheets"
Cohesion: 0.23
Nodes (15): Group(), Row(), SettingsBody(), AppearanceRow(), SignOutRow(), SettingsRowBody(), FilterSheet(), Sheet() (+7 more)

### Community 35 - "Markup Toolbar and History"
Cohesion: 0.17
Nodes (17): Drag, Pinch, TextEdit, MarkupToolbar(), SHORTCUT_HELP, TOOL_BUTTONS, MARK_COLORS, canRedo() (+9 more)

### Community 36 - "Date Picker and Calendar"
Cohesion: 0.25
Nodes (17): DatePicker(), moveTo(), onKeyDown(), pick(), addDays(), addMonths(), CalendarDay, isoDate() (+9 more)

### Community 37 - "Device Notification Docs"
Cohesion: 0.13
Nodes (19): Device notifications (web push), Install as an app (Phase 3.7c), User.offHoursPush outside-hours choice, Filing tickets from a phone (Phase 3.7b), Service worker (public/sw.js), Share to QA Hub (Android share target), Sign out all devices, New ticket drafts (+11 more)

### Community 38 - "Inbox and Notification Store"
Cohesion: 0.15
Nodes (14): describeEvent(), INBOX_PAGE, inboxStore(), InboxThread, LastEvent, previewOf(), scopeSql(), UnreadItem (+6 more)

### Community 39 - "Video Length Checks"
Cohesion: 0.18
Nodes (19): VIDEO_MAX_SECONDS, bufferReader(), mp4Duration(), mvhdDuration(), ReadAt, videoDuration(), vint(), walk() (+11 more)

### Community 40 - "Markup Image Export"
Cohesion: 0.23
Nodes (17): exportImage(), encodeCanvas(), Encoded, shrinkImage(), toBlob(), baseName(), CONVERT_ABOVE_BYTES, convertedName() (+9 more)

### Community 41 - "Markup Drawing"
Cohesion: 0.18
Nodes (17): TextBox(), CROP_DIM, CROP_LINE, DEFAULT_MARK_COLOR, HIDE_COLOR, HIGHLIGHT, ON_MARK, SELECT_HANDLE (+9 more)

### Community 42 - "Ticket Board Columns"
Cohesion: 0.13
Nodes (17): Tone, TicketGroup, BOARD_COLUMN_LIMIT, BOARD_COLUMNS, BoardColumn, BoardColumnKey, movesInto(), TICKET_VIEWS (+9 more)

### Community 43 - "Push Subscriptions and Tones"
Cohesion: 0.16
Nodes (16): pushStore(), DEFAULT_TONE, effectiveTone(), isTone(), PRESET_TONES, ToneId, isPushEndpoint(), key (+8 more)

### Community 44 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 45 - "App Install State"
Cohesion: 0.23
Nodes (12): pushStatus(), DeviceState, deviceState(), Device, noChange(), readDevice(), base64UrlToBytes(), BadgeNav (+4 more)

### Community 46 - "Root Layout and Splash"
Cohesion: 0.16
Nodes (13): geistMono, geistSans, metadata, RootLayout(), viewport, AppSplash(), STEPS, Preloader() (+5 more)

### Community 47 - "Account Server Actions"
Cohesion: 0.22
Nodes (15): avatars, dropFile(), myTone(), push, removeAvatar(), removePushSubscription(), saveAvatar(), savePreviews() (+7 more)

### Community 48 - "Changelog Phases and Workflow"
Cohesion: 0.15
Nodes (17): Phase 2 AI layer (removed workbench), Tickets Board view, QA Hub Changelog, DAR on long bond paper, My DAR for everyone, own details, My DAR first period and rolling periods, Phase 3.5a QA Hub foundation, Move a ticket back a step (+9 more)

### Community 49 - "Markup View and Zoom"
Cohesion: 0.15
Nodes (15): FONT_MAX, FONT_MIN, isTiny(), Shape, MAX_CANVAS_PX, offset(), Size, Vec (+7 more)

### Community 50 - "Ticket Progress Flow"
Cohesion: 0.16
Nodes (15): Flow, FlowInput, FlowStep, FlowStepState, FlowTone, PATH, PathStatus, STEP_LABELS (+7 more)

### Community 51 - "npm Scripts"
Cohesion: 0.12
Nodes (17): scripts, areas:import, backup, build, db:deploy, db:generate, db:migrate, db:seed (+9 more)

### Community 52 - "Profile Avatars"
Cohesion: 0.28
Nodes (11): AvatarUpload(), toAvatarFile(), UserAvatar(), AVATAR_COLORS, AVATAR_PX, AVATAR_SOURCE_MAX_BYTES, avatarColors(), AvatarPerson (+3 more)

### Community 53 - "Ticket Scope and File Route"
Cohesion: 0.17
Nodes (8): TicketError, ticketStore(), areaLabel(), assigneeName(), claimUploads(), load(), uploadCount(), Store

### Community 54 - "Package Dependencies"
Cohesion: 0.12
Nodes (15): @prisma/adapter-pg@^7.10.1, react-dom@19.3.0, sonner@^2.0.8, tw-animate-css@^1.4.0, fflate@^0.8.3, tsx@^4.23.15, name, private (+7 more)

### Community 55 - "ERP Billing API Pipeline"
Cohesion: 0.16
Nodes (14): API.Cloud Host, API On-Premise Host, dcwd_apps-csms-bca-api, BCS, BCS Export Queue, CloudDataContext, DataContext, Meter-Reading Field-to-Bill Workflow (+6 more)

### Community 56 - "DAR Excel Export"
Cohesion: 0.24
Nodes (12): dar, GET(), boxed(), darXlsx(), LINE, longBondOnOnePage(), row(), rowHeight() (+4 more)

### Community 57 - "QA Hub Roadmap Phases"
Cohesion: 0.21
Nodes (13): Cloud Move to Vercel + Supabase, My DAR (Daily Accomplishment Report), Phase 3.10 UI Polish, Phase 3.5 QA Ticket Hub, Phase 3.6a Test Library and Manual Runs, Phase 3.7 QA Hub on Phones, Phase 3.7a Mobile UI Rework, Phase 3.7b Filing from the Phone (+5 more)

### Community 58 - "Business Process Test Suites"
Cohesion: 0.18
Nodes (12): GL (General Ledger), Gross-to-Net, OR (Official Receipt), Oracle, Recon Check, 3-Way Match, Hire-to-Retire / Time-to-Pay Process, Meter-to-Cash Process (+4 more)

### Community 59 - "Ticket Activity Log"
Cohesion: 0.23
Nodes (11): buildActivityLog(), describeFiles(), LogEntry, LogInput, plural(), status(), STATUS_LABELS, ana (+3 more)

### Community 60 - "Avatar and Share Routes"
Cohesion: 0.24
Nodes (8): GET(), notifications, GET(), GET, missed(), POST, getCurrentUser, avatarStore()

### Community 61 - "Product Brief and Access Rules"
Cohesion: 0.20
Nodes (8): Own accounts with admin-approved sign-ups, Nightly npm run backup on the QA laptop, Permissions matrix in lib/auth/permissions.ts, proxy.ts optimistic redirect, Daily Accomplishment Report in 15-day periods, QA Hub product brief, Roles: Admin, QA tester, Developer, Who's-who directory of module owners

### Community 62 - "Account Administration Docs"
Cohesion: 0.20
Nodes (8): Delete user, Designer tick-box (FLAG_GRANTS), Deleting an account, Account management, Design reviews, Designer flag, Failed sign-in lock-out, Password reset requests

### Community 63 - "Markup Shape Helpers"
Cohesion: 0.24
Nodes (9): clampRect(), cropOf(), DEFAULT_TEXT_SIZE, drawOrder(), drawOrderIndexes(), fontSizeFor(), RectShape, textFontSize() (+1 more)

### Community 64 - "Billing and Job Processes"
Cohesion: 0.22
Nodes (10): BAM and Debit/Credit Memos, Billing and Collection Process, JMS Service-Job Workflow, MCR Control Flow, Order of Payment, BAM (Billing Adjustment Memo), JMS (Job Management System), MCR (Customer Record Change) (+2 more)

### Community 65 - "Image Attachment Hook"
Cohesion: 0.36
Nodes (9): captureFrame(), useImageAttachments(), add(), enqueue(), onPaste(), remove(), resolve(), send() (+1 more)

### Community 66 - "Learning Log"
Cohesion: 0.25
Nodes (8): Additive migration first, code second, Cron job and CRON_SECRET, Learning Log, Magic bytes file type detection, Signed URL, SSRF host allow-list, Vercel env vars are read at build time, Daily clean-up GET /api/cron/daily

### Community 67 - "Device Notifications Card"
Cohesion: 0.39
Nodes (8): currentSubscription(), turnOffDevice(), turnOnDevice(), DeviceNotificationsCard(), test(), turnOff(), turnOn(), turnOn()

### Community 68 - "Project Rules and Hosting"
Cohesion: 0.25
Nodes (6): Private attachments bucket, QA Hub project rules, Supabase Postgres and Storage (ap-southeast-1), Vercel hosting (sin1), Local setup steps, QA Hub README

### Community 69 - "Database Connection Rules"
Cohesion: 0.38
Nodes (5): Connection string and pooler, RLS with no policies denies the public API, DATABASE_URL transaction pooler, DIRECT_URL session pooler, Prisma 7 client via lib/db-client.ts

### Community 70 - "Ticket Tabs and Swipe"
Cohesion: 0.43
Nodes (4): TicketTabs(), onTouchEnd(), pick(), swipeStep()

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

### Community 80 - "Mark Ticket Read"
Cohesion: 0.70
Nodes (4): markTicketRead(), closeDeviceNotifications(), MarkRead(), ticketTag()

### Community 81 - "Upload and Session Rules"
Cohesion: 0.50
Nodes (3): Avatar route app/(main)/files/avatar/[userId], File route app/(main)/files/[id], Session guards in lib/auth/session.ts

### Community 83 - "Sheet Grabber Gesture"
Cohesion: 0.70
Nodes (5): Grabber(), onPointerDown(), onPointerMove(), onPointerUp(), sheet()

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

### Community 90 - "Keyboard Open Hook"
Cohesion: 0.83
Nodes (3): snapshot(), subscribe(), useKeyboardOpen()

### Community 92 - "Vercel Config"
Cohesion: 0.50
Nodes (3): crons, regions, $schema

## Knowledge Gaps
- **62 isolated node(s):** `Additive migration first, code second`, `Vercel env vars are read at build time`, `VAPID keys`, `SSRF host allow-list`, `CSS variables for themes` (+57 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 489 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Form Field Components` to `Buttons and Action Dialogs`, `Session and Server Actions`, `Ticket Detail and Inbox`, `Ticket Form and Drafts`, `Dashboard and Shared Helpers`, `Sidebar Navigation`, `Team and User Lists`, `Page Headers and Setup`, `Topbar and Nav Rules`, `DAR Periods and Page`, `DAR Editor and HTML Sheet`, `Attachment Pickers`, `Account Page and Cards`, `DAR Template and Functions`, `Main Layout and Tones`, `Ticket Board Page`, `Theme and User Menu`, `Runtime Dependencies`, `Video and Attachment Upload`, `Settings Page and Sheets`, `Markup Toolbar and History`, `Date Picker and Calendar`, `App Install State`, `Root Layout and Splash`, `Profile Avatars`, `Package Dependencies`, `Install Prompt Hook`, `Mark Ticket Read`, `Keyboard Open Hook`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `MarkupEditor()` (e.g. with `zoomTo()` and `redo()`) actually correct?**
  _`MarkupEditor()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Additive migration first, code second`, `Vercel env vars are read at build time`, `VAPID keys` to the rest of the system?**
  _62 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Buttons and Action Dialogs` be split into smaller, more focused modules?**
  _Cohesion score 0.06715126341294565 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `Test Database Harness` to `Session and Server Actions`, `Auth Store and Backup`, `Ticket Detail and Inbox`, `Ticket Form and Drafts`, `Ticket Store and Schema`, `Topbar and Nav Rules`, `DAR Periods and Page`, `Ticket Workflow Rules`, `DAR Store and Autofill`, `Push Notification Sending`, `Attachment Pickers`, `DAR Template and Functions`, `Theme and User Menu`, `Dev Dependencies`, `Upload File Checks`, `Date Picker and Calendar`, `Inbox and Notification Store`, `Video Length Checks`, `Markup Image Export`, `Ticket Board Columns`, `App Install State`, `Markup View and Zoom`, `Ticket Progress Flow`, `Profile Avatars`, `Ticket Scope and File Route`, `Package Dependencies`, `Ticket Activity Log`, `Ticket Tabs and Swipe`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Should `Session and Server Actions` be split into smaller, more focused modules?**
  _Cohesion score 0.05327281414237936 - nodes in this community are weakly interconnected._
- **Why does `next` connect `Dashboard and Shared Helpers` to `Buttons and Action Dialogs`, `Session and Server Actions`, `Ticket Detail and Inbox`, `Ticket Form and Drafts`, `Form Field Components`, `Sidebar Navigation`, `Team and User Lists`, `Page Headers and Setup`, `Test Database Harness`, `Topbar and Nav Rules`, `DAR Periods and Page`, `Ticket Workflow Rules`, `DAR Editor and HTML Sheet`, `Attachment Pickers`, `Account Page and Cards`, `Ticket Board Page`, `Upload Storage and Routes`, `Theme and User Menu`, `Runtime Dependencies`, `Root Layout and Splash`, `Account Server Actions`, `Package Dependencies`, `DAR Excel Export`, `Avatar and Share Routes`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._