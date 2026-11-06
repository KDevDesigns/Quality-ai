# Graph Report - Quality-ai  (2026-11-06)

## Corpus Check
- 312 files · ~206,354 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .example 1)

## Summary
- 2121 nodes · 5975 edges · 117 communities (105 shown, 12 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 177 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a250f9e7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- lucide-react
- login/actions.ts
- lib/backup.ts
- format.ts
- draft.ts
- (main)/page.tsx
- react
- permissions.ts
- sidebar.tsx
- team/page.tsx
- skeletons.tsx
- vitest
- tickets/store.ts
- nav.ts
- period.ts
- workflow.ts
- dar/store.ts
- dar-sheet.tsx
- Environment variables
- account/actions.ts
- image-picker.tsx
- MarkupEditor
- notifications-card.tsx
- template.ts
- (main)/layout.tsx
- tickets/page.tsx
- uploads/storage.ts
- user-menu.tsx
- dependencies
- devDependencies
- video-picker.tsx
- shapes.ts
- components.json
- files.ts
- settings/page.tsx
- markup-editor.tsx
- date-picker.tsx
- Device notifications
- notifications.ts
- tickets/actions.ts
- markup.test.ts
- draw.ts
- board.ts
- requireAction
- compilerOptions
- install-card.tsx
- app/layout.tsx
- requireUser
- QA Hub Changelog
- view.ts
- ticket-view.tsx
- scripts
- avatar-upload.tsx
- TicketStore
- package.json
- dcwd_apps-csms-bca-api
- dar-store.test.ts
- QA AI for In-House ERP Build Plan
- Phase 6 Business-Process Suites
- UI (Web) Rework: developer handoff
- session.ts
- QA Hub product brief
- Account management
- ticket-peek.tsx
- Billing and Collection Process
- useImageAttachments
- Learning Log
- device-push.ts
- QA Hub project rules
- Prisma 7 client via lib/db-client.ts
- ticket-tabs.tsx
- QA Hub moves to Vercel + Supabase
- sw.js
- interface
- Notifications
- users/page.tsx
- PushPrompt
- Web Push service worker and subscription
- grilling skill (.claude)
- Stack: Next.js 16, React 19, TypeScript, Tailwind 4
- mark-read.tsx
- Hard rule: uploads use generated names and post-upload checks
- Hard rule: ticket data never goes to an LLM
- Grabber
- My DAR (Daily Accomplishment Report)
- ticket-form.tsx
- select-field.tsx
- interface
- Hide tool (solid black box)
- DCWD CSMS BCA API Process Flow
- progress.ts
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
- utils.ts
- limits.ts
- module-progress.tsx
- DarEditor
- proxy.ts
- UI (Web) Rework: design notes

## God Nodes (most connected - your core abstractions)
1. `react` - 86 edges
2. `lucide-react` - 63 edges
3. `next` - 57 edges
4. `MarkupEditor()` - 49 edges
5. `vitest` - 46 edges
6. `requireAction()` - 44 edges
7. `Button()` - 39 edges
8. `TicketStore` - 34 edges
9. `can()` - 33 edges
10. `text()` - 30 edges

## Surprising Connections (you probably didn't know these)
- `2. Suggested build order` --references--> `createTicket()`  [INFERRED]
  docs/design/ui-web-rework/HANDOFF.md → app/(main)/tickets/actions.ts
- `10. States and interactions` --references--> `InlineAlert()`  [INFERRED]
  docs/design/ui-web-rework/HANDOFF.md → components/inline-alert.tsx
- `App shell` --references--> `navGroups()`  [INFERRED]
  docs/design/ui-web-rework/HANDOFF.md → components/nav.ts
- `9. Don't copy from the prototype` --references--> `SelectField()`  [INFERRED]
  docs/design/ui-web-rework/HANDOFF.md → components/select-field.tsx
- `My DAR: `dar/`, `Dar.dc.html`` --references--> `periodDays()`  [INFERRED]
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

## Communities (117 total, 12 thin omitted)

### Community 0 - "lucide-react"
Cohesion: 0.14
Nodes (28): ToneSelect(), UserFormState, ApprovalContext, Open, PendingActions(), ResetRequestActions(), SignUpRequest, copyText() (+20 more)

### Community 1 - "login/actions.ts"
Cohesion: 0.06
Nodes (35): ClaimState, claimTempPassword(), emailError(), login(), requestPasswordReset(), signup(), SignupState, signupStatus() (+27 more)

### Community 2 - "lib/backup.ts"
Cohesion: 0.09
Nodes (34): AreaFile, code, importAreas(), ImportReport, Row, subArea, areaLevels(), ownDarDetails() (+26 more)

### Community 3 - "format.ts"
Cohesion: 0.12
Nodes (15): Attachments(), Evidence(), FileRow, Item, GalleryImage, ImageThumb(), dateOnly, dateTime (+7 more)

### Community 4 - "draft.ts"
Cohesion: 0.09
Nodes (30): DraftCleanup(), storage(), TicketForm(), clearDraft(), PwaSetup(), New ticket: `tickets/new/page.tsx`, `ticket-form.tsx`, `NewTicket.dc.html`, DRAFT_FIELDS, DRAFT_MAX_AGE_MS (+22 more)

### Community 5 - "(main)/page.tsx"
Cohesion: 0.11
Nodes (19): adminHome(), Counts, firstName(), ICON_BOX, Me, notifications, Overview(), plural() (+11 more)

### Community 6 - "react"
Cohesion: 0.19
Nodes (20): ROLE_CARDS, dar, saveDarProfile(), PeriodOption, Field(), FormMessage(), FormSection(), InfoTip() (+12 more)

### Community 7 - "permissions.ts"
Cohesion: 0.12
Nodes (26): derive(), dummyPasswordHash(), hashPassword(), verifyPassword(), Action, ACTIONS, Flag, FLAG_GRANTS (+18 more)

### Community 8 - "sidebar.tsx"
Cohesion: 0.07
Nodes (31): brandText, fadeText, groupLabel, navButton, Badge(), badgeVariants, Separator(), Sidebar() (+23 more)

### Community 9 - "team/page.tsx"
Cohesion: 0.13
Nodes (18): ModuleLink, ModuleList(), Member, metadata, SearchParams, TeamBody(), teamHref(), AreaDialog() (+10 more)

### Community 10 - "skeletons.tsx"
Cohesion: 0.16
Nodes (12): metadata, DarSkeleton(), DashboardSkeleton(), FormSkeleton(), InboxSkeleton(), ListRows(), SettingsSkeleton(), TableSkeleton() (+4 more)

### Community 11 - "vitest"
Cohesion: 0.08
Nodes (23): GET(), createRateLimiter(), RATE_LIMIT_KEEP_MS, RateLimiter, cronAuthorized(), dailyCleanup(), LEGACY_TEMPLATE, lib_generated_prisma_client (+15 more)

### Community 12 - "tickets/store.ts"
Cohesion: 0.08
Nodes (27): categoryInput, commentInput, emptyToNull, param, TICKET_GROUPS, TicketEdit, ticketFields, TicketFilters (+19 more)

### Community 13 - "nav.ts"
Cohesion: 0.11
Nodes (30): focusSoon(), SidebarView(), AppTopbar(), TopbarView(), BottomNav(), ACCOUNT_SECTIONS, ADMIN_NAV, backTarget() (+22 more)

### Community 14 - "period.ts"
Cohesion: 0.18
Nodes (24): dar, DarBody(), metadata, FirstPeriodField(), SetupBody(), daysInMonth(), DOWS, firstPeriodOf() (+16 more)

### Community 15 - "workflow.ts"
Cohesion: 0.08
Nodes (45): RecentTickets(), BoardCard, BoardColumnData, Card(), ColumnTabs(), Pending, stillPending(), Task (+37 more)

### Community 16 - "dar/store.ts"
Cohesion: 0.19
Nodes (22): Activity, ActivityArea, areaLabel(), blankRow(), buildCells(), DarCells, dayEntries(), daysAttended() (+14 more)

### Community 17 - "dar-sheet.tsx"
Cohesion: 0.15
Nodes (18): print(), DarSheet(), focusCell(), FONT, FunctionRows(), isRestDay(), br(), DAR_COLORS (+10 more)

### Community 18 - "Environment variables"
Cohesion: 0.12
Nodes (28): Lighter on the free plan, Storage bucket attachments, BACKUP_DIR, CRON_SECRET, Daily clean-up cron (/api/cron/daily), Database change workflow, DATABASE_URL, Deployment flow (+20 more)

### Community 19 - "account/actions.ts"
Cohesion: 0.09
Nodes (37): avatars, push, sendTestPush(), deviceLabel(), clip(), PushEvent, pushMessage, PushTicket (+29 more)

### Community 20 - "image-picker.tsx"
Cohesion: 0.21
Nodes (17): AttachMenu(), EVIDENCE_BOX, EVIDENCE_INPUT, EvidenceBox(), cameraInputId(), canCaptureScreen(), ImageAttachments, ImagePicker() (+9 more)

### Community 21 - "MarkupEditor"
Cohesion: 0.15
Nodes (25): hasText(), MarkupEditor(), applyFont(), bumpSize(), commitEdit(), movePinch(), onDoubleClick(), onFingerDown() (+17 more)

### Community 22 - "notifications-card.tsx"
Cohesion: 0.24
Nodes (11): DAYS, OFF_HOURS, WorkHoursCard(), Card(), CardContent(), CardDescription(), CardHeader(), CardTitle() (+3 more)

### Community 23 - "template.ts"
Cohesion: 0.18
Nodes (11): dar, GET(), parsePeriod(), DarHeader, DarProfileInput, DarProfileRow, functionList, legacyTemplate (+3 more)

### Community 24 - "(main)/layout.tsx"
Cohesion: 0.08
Nodes (35): playTone(), SessionBottomNav(), SessionSidebar(), SessionTopbar(), sessionUser(), RequestsCount(), markAllTicketsRead(), ToneListener() (+27 more)

### Community 25 - "tickets/page.tsx"
Cohesion: 0.07
Nodes (36): boardCard(), hrefWith(), metadata, MORE, notifications, Pager(), Quick, quickViews() (+28 more)

### Community 26 - "uploads/storage.ts"
Cohesion: 0.21
Nodes (17): DELETE(), POST(), tickets, fail(), uploader(), body, POST(), tickets (+9 more)

### Community 27 - "user-menu.tsx"
Cohesion: 0.25
Nodes (14): AppearancePicker(), MODES, listeners, readAccent(), setAccent(), useAccent(), Appearance(), ACCENT_SCRIPT (+6 more)

### Community 28 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, @base-ui/react, class-variance-authority, cn, lucide-react, next, next-themes, pg (+12 more)

### Community 29 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, dotenv, @electric-sql/pglite, eslint, eslint-config-next, fflate, pglite-prisma-adapter, @playwright/test (+11 more)

### Community 30 - "video-picker.tsx"
Cohesion: 0.24
Nodes (16): connectionType(), probeDuration(), Upload, useVideoUpload(), send(), start(), VideoPicker(), formatDuration() (+8 more)

### Community 31 - "shapes.ts"
Cohesion: 0.11
Nodes (36): onPointerMove(), drawSelection(), bounds(), calloutBox(), distToSegment(), estimateWidth(), Handle, handlesOf() (+28 more)

### Community 32 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 33 - "files.ts"
Cohesion: 0.10
Nodes (41): checkUploaded(), cleanOriginalName(), EXT, FileType, mb(), newStoredName(), planUpload(), sniffImage() (+33 more)

### Community 34 - "settings/page.tsx"
Cohesion: 0.11
Nodes (18): logout(), metadata, AppearanceRow(), SignOutRow(), rowClass, SettingsRowBody(), TILES, TileTone (+10 more)

### Community 35 - "markup-editor.tsx"
Cohesion: 0.17
Nodes (17): Drag, Pinch, TextEdit, MarkupToolbar(), SHORTCUT_HELP, TOOL_BUTTONS, MARK_COLORS, canRedo() (+9 more)

### Community 36 - "date-picker.tsx"
Cohesion: 0.31
Nodes (14): DatePicker(), moveTo(), onKeyDown(), pick(), addDays(), addMonths(), CalendarDay, isoDate() (+6 more)

### Community 37 - "Device notifications"
Cohesion: 0.13
Nodes (21): Device notifications (web push), Install as an app (Phase 3.7c), User.offHoursPush outside-hours choice, Filing tickets from a phone (Phase 3.7b), Service worker (public/sw.js), Share to QA Hub (Android share target), Sign out all devices, New ticket drafts (+13 more)

### Community 38 - "notifications.ts"
Cohesion: 0.16
Nodes (14): lib_generated_prisma_client_prisma, TicketCreate, describeEvent(), INBOX_PAGE, inboxStore(), InboxThread, LastEvent, previewOf() (+6 more)

### Community 39 - "tickets/actions.ts"
Cohesion: 0.17
Nodes (26): addComment(), assignTicket(), categorizeTicket(), createTicket(), deleteTicket(), editTicket(), fields(), moveTicket() (+18 more)

### Community 40 - "markup.test.ts"
Cohesion: 0.19
Nodes (20): exportImage(), saveImage(), encodeCanvas(), Encoded, shrinkImage(), toBlob(), baseName(), CONVERT_ABOVE_BYTES (+12 more)

### Community 41 - "draw.ts"
Cohesion: 0.18
Nodes (17): TextBox(), CROP_DIM, CROP_LINE, DEFAULT_MARK_COLOR, HIDE_COLOR, HIGHLIGHT, ON_MARK, SELECT_HANDLE (+9 more)

### Community 42 - "board.ts"
Cohesion: 0.09
Nodes (32): StatusMoves(), BOARD_COLUMNS, columnInView(), movesInto(), FORWARD, isForward(), isRedMove(), moveLayout (+24 more)

### Community 43 - "requireAction"
Cohesion: 0.20
Nodes (20): approveSignUp(), createUser(), deleteUser(), deletion, deletionPreview(), dismissResetRequest(), duplicateEmail(), rejectSignUp() (+12 more)

### Community 44 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 45 - "install-card.tsx"
Cohesion: 0.27
Nodes (10): Device, InstallCard(), noChange(), readDevice(), BadgeNav, isInstalled(), isIos(), isWindows() (+2 more)

### Community 46 - "app/layout.tsx"
Cohesion: 0.11
Nodes (16): app_globals, geistMono, geistSans, metadata, viewport, AppSplash(), ResetSplash(), STEPS (+8 more)

### Community 47 - "requireUser"
Cohesion: 0.25
Nodes (9): pushStatus(), savePreviews(), saveTone(), saveWorkHours(), ToneCard(), save(), SettingsBody(), ToTicketPage() (+1 more)

### Community 48 - "QA Hub Changelog"
Cohesion: 0.15
Nodes (17): Phase 2 AI layer (removed workbench), Tickets Board view, QA Hub Changelog, DAR on long bond paper, My DAR for everyone, own details, My DAR first period and rolling periods, Phase 3.5a QA Hub foundation, Move a ticket back a step (+9 more)

### Community 49 - "view.ts"
Cohesion: 0.21
Nodes (12): ImageGallery(), show(), zoomTo(), clampViewerZoom(), MAX_CANVAS_PX, offset(), Size, stepZoom() (+4 more)

### Community 50 - "ticket-view.tsx"
Cohesion: 0.06
Nodes (51): RequestList(), ThreadRow(), NewTicket(), Message(), Thread(), StepTip(), AssignControl(), CommentForm() (+43 more)

### Community 51 - "scripts"
Cohesion: 0.12
Nodes (17): scripts, areas:import, backup, build, db:deploy, db:generate, db:migrate, db:seed (+9 more)

### Community 52 - "avatar-upload.tsx"
Cohesion: 0.19
Nodes (18): dropFile(), removeAvatar(), saveAvatar(), Person(), AvatarUpload(), toAvatarFile(), useAvatarUpload(), pick() (+10 more)

### Community 53 - "TicketStore"
Cohesion: 0.14
Nodes (14): memberModules(), scopeWhere(), TicketError, TicketStore, areaLabel(), assigneeName(), claimUploads(), filterWhere() (+6 more)

### Community 54 - "package.json"
Cohesion: 0.06
Nodes (32): eslintConfig, id, optionalText(), allowScripts, esbuild@0.28.2, prisma@7.10.1, @prisma/engines@7.10.1, unrs-resolver@1.12.2 (+24 more)

### Community 55 - "dcwd_apps-csms-bca-api"
Cohesion: 0.16
Nodes (15): API.Cloud Host, API On-Premise Host, NSC Authorization Risk, dcwd_apps-csms-bca-api, BCS, BCS Export Queue, CloudDataContext, DataContext (+7 more)

### Community 56 - "dar-store.test.ts"
Cohesion: 0.17
Nodes (13): boxed(), darXlsx(), LINE, longBondOnOnePage(), row(), rowHeight(), Spec, text() (+5 more)

### Community 57 - "QA AI for In-House ERP Build Plan"
Cohesion: 0.21
Nodes (14): Cloud Move to Vercel + Supabase, Hybrid Privacy Routing, My DAR (Daily Accomplishment Report), Phase 3.10 UI Polish, Phase 3.5 QA Ticket Hub, Phase 3.6a Test Library and Manual Runs, Phase 3.7 QA Hub on Phones, Phase 3.7a Mobile UI Rework (+6 more)

### Community 58 - "Phase 6 Business-Process Suites"
Cohesion: 0.18
Nodes (13): GL (General Ledger), Gross-to-Net, OR (Official Receipt), Oracle, Recon Check, 3-Way Match, Deterministic Oracles, Hire-to-Retire / Time-to-Pay Process (+5 more)

### Community 59 - "UI (Web) Rework: developer handoff"
Cohesion: 0.07
Nodes (33): 10. States and interactions, 11. Motion, 12. Edge cases and limits, 13. Done means, 2. Suggested build order, 3. Sizes and layout, 4. Design tokens, 6. Pages (+25 more)

### Community 60 - "session.ts"
Cohesion: 0.15
Nodes (19): GET(), notifications, changePassword(), GET(), GET(), GET, missed(), POST (+11 more)

### Community 61 - "QA Hub product brief"
Cohesion: 0.20
Nodes (11): Own accounts with admin-approved sign-ups, Nightly npm run backup on the QA laptop, Permissions matrix in lib/auth/permissions.ts, proxy.ts optimistic redirect, Hard rule: behind login, Hard rule: free-tier limits, Daily Accomplishment Report in 15-day periods, Principle: function comes first (+3 more)

### Community 62 - "Account management"
Cohesion: 0.20
Nodes (11): Delete user, Designer tick-box (FLAG_GRANTS), Deleting an account, Account management, Design reviews, Designer flag, Failed sign-in lock-out, Last admin lock-out protection (+3 more)

### Community 63 - "ticket-peek.tsx"
Cohesion: 0.17
Nodes (16): ApprovalHost(), ResetPasswordButton(), PeekLink(), TicketPeek(), Check, closeAllowed(), CloseGuardContext, CloseGuardProvider (+8 more)

### Community 64 - "Billing and Collection Process"
Cohesion: 0.22
Nodes (10): BAM and Debit/Credit Memos, Billing and Collection Process, JMS Service-Job Workflow, MCR Control Flow, Order of Payment, BAM (Billing Adjustment Memo), JMS (Job Management System), MCR (Customer Record Change) (+2 more)

### Community 65 - "useImageAttachments"
Cohesion: 0.36
Nodes (9): captureFrame(), useImageAttachments(), add(), enqueue(), onPaste(), remove(), resolve(), send() (+1 more)

### Community 66 - "Learning Log"
Cohesion: 0.25
Nodes (8): Additive migration first, code second, Cron job and CRON_SECRET, Learning Log, Magic bytes file type detection, Signed URL, SSRF host allow-list, Vercel env vars are read at build time, Daily clean-up GET /api/cron/daily

### Community 67 - "device-push.ts"
Cohesion: 0.31
Nodes (11): removePushSubscription(), savePushSubscription(), currentSubscription(), deviceState, turnOffDevice(), turnOnDevice(), DeviceNotificationsCard(), test() (+3 more)

### Community 68 - "QA Hub project rules"
Cohesion: 0.25
Nodes (8): Private attachments bucket, Build one phase at a time, QA Hub project rules, Hard rule: secrets only in .env.local and Vercel, Supabase Postgres and Storage (ap-southeast-1), Vercel hosting (sin1), Local setup steps, QA Hub README

### Community 69 - "Prisma 7 client via lib/db-client.ts"
Cohesion: 0.38
Nodes (7): Connection string and pooler, RLS with no policies denies the public API, DATABASE_URL pointed at a Vercel Prisma Postgres store, DATABASE_URL transaction pooler, DIRECT_URL session pooler, Prisma 7 client via lib/db-client.ts, Hard rule: RLS on for every table with no policies

### Community 70 - "ticket-tabs.tsx"
Cohesion: 0.21
Nodes (10): ActiveTab, tabId(), TABS, TicketPane(), TicketTab, TicketTabs(), onKeyDown(), onTouchEnd() (+2 more)

### Community 71 - "QA Hub moves to Vercel + Supabase"
Cohesion: 0.29
Nodes (7): lib/backup.ts backup and restore, QA Hub moves to Vercel + Supabase, Daily clean-up cron (changelog), Profile photo and per-person colours, RateLimitHit database counters, RLS on with no policies, Direct signed-URL uploads

### Community 72 - "sw.js"
Cohesion: 0.43
Nodes (4): askToPlay(), playInATab(), qaHubTabs(), refreshTabs()

### Community 73 - "interface"
Cohesion: 0.33
Nodes (5): interface, display_name, short_description, policy, allow_implicit_invocation

### Community 74 - "Notifications"
Cohesion: 0.33
Nodes (6): Hide tool (solid black box), My inbox, Notification bell, Notifications, Mark up screenshot tools, Sidebar counts

### Community 75 - "users/page.tsx"
Cohesion: 0.12
Nodes (13): metadata, RequestRow, STATUS_TONE, Tab, TABS, SignOutDevicesButton(), UserDialog(), dar (+5 more)

### Community 76 - "PushPrompt"
Cohesion: 0.21
Nodes (11): myTone(), PushPrompt(), notNow(), turnOn(), read(), write(), changed(), InstallEvent (+3 more)

### Community 77 - "Web Push service worker and subscription"
Cohesion: 0.40
Nodes (5): Notification privacy trade-off, VAPID keys, Web Push service worker and subscription, Installable app with push notifications, No offline mode

### Community 78 - "grilling skill (.claude)"
Cohesion: 0.40
Nodes (5): grill-me skill (.claude), Design tree (.claude), Facts are the agent's job, decisions are the user's (.claude), Decision frontier (.claude), grilling skill (.claude)

### Community 79 - "Stack: Next.js 16, React 19, TypeScript, Tailwind 4"
Cohesion: 0.40
Nodes (5): Next.js agent feedback pass, Next.js agent rules, Hard rule: Node.js runtime without a runtime export, Stack: Next.js 16, React 19, TypeScript, Tailwind 4, Vitest on PGlite

### Community 80 - "mark-read.tsx"
Cohesion: 0.70
Nodes (4): markTicketRead(), closeDeviceNotifications(), MarkRead(), ticketTag()

### Community 81 - "Hard rule: uploads use generated names and post-upload checks"
Cohesion: 0.50
Nodes (5): Avatar route app/(main)/files/avatar/[userId], File route app/(main)/files/[id], Hard rule: uploads use generated names and post-upload checks, Session guards in lib/auth/session.ts, Read the session only inside Suspense

### Community 82 - "Hard rule: ticket data never goes to an LLM"
Cohesion: 0.40
Nodes (5): Hard rule: ticket data never goes to an LLM, Read-only Supabase MCP server without database features, Mock-ups use made-up sample content, Principle: protect customer data by default, Ticket data never goes to an LLM (product constraint)

### Community 83 - "Grabber"
Cohesion: 0.70
Nodes (5): Grabber(), onPointerDown(), onPointerMove(), onPointerUp(), sheet()

### Community 84 - "My DAR (Daily Accomplishment Report)"
Cohesion: 0.40
Nodes (5): DAR privacy rule, My DAR set-up, Module codes, My DAR (Daily Accomplishment Report), Team & modules

### Community 85 - "ticket-form.tsx"
Cohesion: 0.15
Nodes (15): FunctionsEditor(), AssignForm(), DeleteTicketDialog(), MoveForm(), NOTE_HINTS, Ref, AssigneeSelect(), DESCRIPTION_HINTS (+7 more)

### Community 86 - "select-field.tsx"
Cohesion: 0.18
Nodes (11): FilterSelect(), SelectField(), SelectOption, SelectOptionGroup, components_ui_select_select, SelectContent(), SelectGroup(), SelectItem() (+3 more)

### Community 87 - "interface"
Cohesion: 0.50
Nodes (3): interface, display_name, short_description

### Community 88 - "Hide tool (solid black box)"
Cohesion: 0.50
Nodes (4): Hide tool (solid black box), My inbox, Messenger-style, Notification bell and TicketRead, Screenshot markup editor

### Community 89 - "DCWD CSMS BCA API Process Flow"
Cohesion: 0.67
Nodes (4): Branch Selection Risk, Recommended Operating Model, DCWD CSMS BCA API Process Flow, ERP Glossary

### Community 90 - "progress.ts"
Cohesion: 0.22
Nodes (14): counts(), fairScore(), LEFT_OUT, MIN_TICKETS, moduleProgress, percent(), Progress, ProgressArea (+6 more)

### Community 91 - "Ticket with evidence and conversation"
Cohesion: 0.50
Nodes (4): Android share into a new ticket, Principle: serve both sides of a ticket, Principle: keep the whole story on the ticket, Ticket with evidence and conversation

### Community 92 - "vercel.json"
Cohesion: 0.50
Nodes (3): crons, regions, $schema

### Community 93 - "Phase 3.6b Record and Replay Regression"
Cohesion: 0.67
Nodes (3): Healer Guardrail, Phase 3.6b Record and Replay Regression, Phase 5 Automated Runner

### Community 101 - "inbox/page.tsx"
Cohesion: 0.19
Nodes (11): hrefWith(), inbox, metadata, Params, parse(), tickets, galleryImages(), SeverityTag() (+3 more)

### Community 102 - "team/actions.ts"
Cohesion: 0.24
Nodes (11): deleteArea(), duplicateCode(), saveArea(), AreaForm(), AreaNode, nextSortOrder(), placementError(), AreaInput (+3 more)

### Community 103 - "shell.js"
Cohesion: 0.27
Nodes (10): apply(), closeMenu(), fillPanel(), hideTip(), icon(), markAllRead(), openMenu(), setPanel() (+2 more)

### Community 104 - "account/page.tsx"
Cohesion: 0.18
Nodes (10): AccountTab, AccountTabs(), onKeyDown(), pick(), ALIASES, AccountBody(), metadata, WAVES (+2 more)

### Community 105 - "users-filter.test.ts"
Cohesion: 0.24
Nodes (9): one(), UsersBody(), FilterableUser, filterUsers(), STATUS_LABELS, UserFilters, userStatus, names() (+1 more)

### Community 106 - "utils.ts"
Cohesion: 0.41
Nodes (5): PhoneNav, Tooltip(), TooltipContent(), TooltipTrigger(), lib_utils_cn

### Community 107 - "limits.ts"
Cohesion: 0.24
Nodes (7): manifest(), IMAGE_TYPES, MAX_PENDING_PER_USER, MAX_VIDEOS_PER_POST, UploadKind, VIDEO_MAX_MB, VIDEO_TYPES

### Community 108 - "module-progress.tsx"
Cohesion: 0.28
Nodes (8): BAR, INK, ModuleProgressCard(), ModuleProgressSection(), scoreText(), ModuleScope(), ScoreDot(), progressTone

### Community 110 - "DarEditor"
Cohesion: 0.36
Nodes (7): refillDar(), saveDar(), DarEditor(), download(), refill(), save(), isEmptySetup()

### Community 111 - "proxy.ts"
Cohesion: 0.43
Nodes (5): SESSION_COOKIE, SESSION_MAX_AGE_S, sessionCookieOptions(), config, proxy()

### Community 112 - "UI (Web) Rework: design notes"
Cohesion: 0.50
Nodes (3): Boards, New features, UI (Web) Rework: design notes

## Knowledge Gaps
- **483 isolated node(s):** `vercel`, `supabase`, `AccountTab`, `ALIASES`, `push` (+478 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 647 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `lucide-react`, `login/actions.ts`, `draft.ts`, `(main)/page.tsx`, `sidebar.tsx`, `team/page.tsx`, `skeletons.tsx`, `nav.ts`, `period.ts`, `workflow.ts`, `dar-sheet.tsx`, `image-picker.tsx`, `notifications-card.tsx`, `(main)/layout.tsx`, `tickets/page.tsx`, `user-menu.tsx`, `video-picker.tsx`, `settings/page.tsx`, `markup-editor.tsx`, `date-picker.tsx`, `install-card.tsx`, `app/layout.tsx`, `requireUser`, `ticket-view.tsx`, `avatar-upload.tsx`, `package.json`, `session.ts`, `ticket-peek.tsx`, `ticket-tabs.tsx`, `users/page.tsx`, `PushPrompt`, `mark-read.tsx`, `ticket-form.tsx`, `select-field.tsx`, `inbox/page.tsx`, `account/page.tsx`, `utils.ts`, `table.tsx`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Why does `Account management` connect `Account management` to `Environment variables`, `Device notifications`, `permissions.ts`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Why does `Lost phone procedure` connect `Device notifications` to `Account management`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `MarkupEditor()` (e.g. with `zoomTo()` and `redo()`) actually correct?**
  _`MarkupEditor()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `vercel`, `supabase`, `AccountTab` to the rest of the system?**
  _483 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `lucide-react` be split into smaller, more focused modules?**
  _Cohesion score 0.14444444444444443 - nodes in this community are weakly interconnected._
- **Should `login/actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06280193236714976 - nodes in this community are weakly interconnected._