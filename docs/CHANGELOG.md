# Changelog

## Notification sound and live updates fixed (2026-10-31)

- **Pages update the moment a notification arrives:** the bell, the sidebar counts, My inbox and an open ticket no
  longer wait for the next check (which also went from every 30 to every 15 seconds, and now also runs when you switch
  back to the window).
- **The tone is reliable:** only a QA Hub tab that is on screen is asked to play it. A tab in the background (asleep on
  a PC, or on a phone) used to hold the notification back or, on Android, swallow the sound; now the device's own sound
  plays straight away instead.
- **Preview builds:** the database client is created on first use, so Vercel Preview builds no longer fail without
  `DATABASE_URL`.
- Code: `public/sw.js`, `app/(main)/tone-listener.tsx`, `components/notifications.tsx`, `lib/db.ts`.

## Device notifications (2026-10-31)

- **Notifications on this device** (My account): Windows, Mac, Android and iPhone notifications for a new or assigned
  ticket, a reply, a status change or an edit, even with QA Hub closed. **Turn on** once per device; **Send test** and
  **Turn off** are there too. Clicking one opens the ticket.
  - **Asked after sign-in:** on a device where they're off, a **Turn on notifications?** dialog offers them (Not now
    hides it there for 14 days). On an iPhone not yet on the Home Screen it shows how to add it.
  - **Notification sound:** pick Tone 1–11 (default Tone 1), Silent, or upload your own MP3/WAV (5 s, 500 KB), with
    ▶ to preview, in My account or the sign-in question. An open QA Hub tab plays it and the system notification stays
    silent; with QA Hub closed the device's own sound plays. Own tones are checked by their real bytes and length,
    stored under generated names in the private bucket, played only through `/tones/mine` (session-checked) and
    backed up. Migration `notification_tones`; code in `lib/push/tones.ts` and `lib/uploads/audio.ts`.
  - They lead with the message: the ticket's title, `Ana: <message>` (cut at about 120 characters, with 📷/🎥 when
    something is attached), `Module: Billing`, and the reply's first photo on Windows and Android (through a link that
    expires after 10 minutes). A status change shows its note. Replies on one ticket stack ("3 new replies"); opening
    the ticket clears it.
  - **Show message previews** (on by default, My account → Sound and previews): off gives only
    `#12 · Bug / New reply from Ana / Module: Billing`, with no ticket text or photo. The guide shows how to hide
    previews on locked phones and PCs. Migration `push_previews`.
  - **Work hours:** *Only notify me during work hours* keeps devices quiet outside the chosen hours and days
    (Philippine time). The bell and My inbox still show everything.
  - iPhone and iPad: iOS 16.4+ and QA Hub added to the Home Screen first. Windows and Mac: the browser must be running.
    Details and the firewall list for IT: `docs/OPERATIONS.md` §5b.
- **Install QA Hub:** a web app manifest, so phones can add it to the Home Screen with the DCWD seal.
- **Setup:** three new settings, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT` (make the keys
  with `npx web-push generate-vapid-keys`). Migration `push_subscriptions` (RLS on). Without the keys nothing is sent.
- Code: `lib/push/` (message text, recipients and work hours, device store, sending and clean-up of dead devices; unit
  tested with a fake push service), `public/sw.js`, `app/manifest.ts`, and the card in `app/(main)/account/`. The
  server only accepts push addresses of the real browser push services, so nobody can make it call another URL.

## My inbox, Messenger-style (2026-10-31)

- **My inbox** is back in the sidebar, for everyone: the conversations on your tickets on the left (newest first, last message preview, red dot, unread reply count), the selected ticket's messages on the right with the description as the first message, and a reply box (Enter sends; images go through the markup tools). Search, an Unread filter and Show more. On a phone it shows the list, then the conversation with a back link. **Open ticket** leads to the full page for status changes and editing.
- **Sidebar counts split:** **My inbox ● N** counts unread replies from others; **Tickets ● N** counts new tickets you haven't opened (developers: newly assigned; admins: newly filed). The bell still shows all activity and links to the inbox.
- Live: the inbox refreshes by itself when something new arrives, like the ticket pages.
- **Site icon:** the browser tab and phone home-screen icon are the DCWD seal instead of the Next.js logo; the unused template images are gone.
- Code: `lib/tickets/inbox.ts` (conversation list and previews) and `counts` / `unreadMessages` in `lib/tickets/notifications.ts`, with tests. The ticket page's conversation moved to `app/(main)/tickets/[number]/conversation.tsx` so the inbox shows messages exactly the same way.

## Screenshot markup (2026-10-31)

- **Mark up screenshot:** every image added to a ticket or reply (paste, Add images, drop) opens in a markup editor before it uploads: **Box**, **Arrow**, **Pen**, **Text**, **Hide** (a solid black box) and **Crop**, four colours, undo and redo, keys B/A/P/T/H/C and Ctrl+Z/Ctrl+Y. Several images go through it one after another ("2 of 3").
  - **Use image** uploads only the marked-up copy (PNG, or JPEG if the PNG would be over 10 MB), so hidden data never leaves the PC. **Use original** and **Remove** are there too, and the pencil on a thumbnail reopens it.
  - Hide is a black box, not a blur: blurred or pixelated text can be recovered by de-pixelation tools.
- **Capture screen** (Chrome and Edge on a PC): pick a tab or window, such as the ERP; one frame is taken, sharing stops at once, and it opens in the editor.
- **Paste goes to Screenshots:** Ctrl+V pastes a screenshot into the **Screenshots** box (click it, or just paste anywhere on the page outside a text box). The Description box no longer takes images. In a reply, pasting into the message still works.
- **Sidebar:** the red count on Tickets and Users is centred on the row.
- Code: `lib/markup/` (shapes, undo history, export rules; unit-tested) and `app/(main)/tickets/markup/markup-editor.tsx` (canvas). The image picker queues images for the editor. Next: a Chrome/Edge extension that captures the ERP in one click and opens this editor (Phase 3.9).

## Notifications, forgot password, clearer sign-up, admin's own DAR (2026-10-31)

- **Notifications:** a bell in the top bar with the number of tickets that have something new for you and a list of the newest, a red count on **Tickets** in the sidebar, and a red dot plus bold title on unread rows in the ticket list and the dashboard. "New" is anything someone else did on a ticket you can see; your own actions never count. Opening a ticket marks it read; **Mark all as read** clears all.
  - The app polls `GET /api/notifications` every 30 s while the tab is visible (and at once when you return), and refreshes ticket lists and the open ticket by itself when something new arrives. No reload needed.
  - Data: `Ticket.lastActivityById` (who acted last, set on every change) and a `TicketRead` table (when each person last opened each ticket), migration `notifications_reset_requests`, RLS on. Logic in `lib/tickets/notifications.ts`, with tests.
  - The disabled "My inbox" sidebar item is gone; the bell replaces it.
- **Forgot password:** a **Forgot your password?** link on the sign-in page sends a request to **Admin → Users → Password reset requests** (no email is sent). The admin resets it there and hands over the temporary password, or dismisses it. Limited to 5 per email and 30 in total per hour. Admins also see a count on **Users** in the sidebar and on the dashboard.
- **Sign-up:** an email that already has an account, or a request waiting for approval, now says so instead of pretending to send a new request.
- **Admin's own DAR:** admins have **My DAR** too, with buttons to switch between it and the DAR template. Each person still sees only their own DAR.
- **Dashboard per role:** developers and QA testers see only their own work: their three ticket counts, their tickets and **My modules** (full width). The team counts and **Not in any module** are now for admins only.
- **Replies send on Enter:** in a ticket's reply box, Enter sends and Shift+Enter starts a new line (it was Ctrl+Enter). Enter waits while an image or video is still uploading.

## QA Hub moves to Vercel + Supabase (2026-10-31)

- **Hosting:** QA Hub now runs on Vercel (HTTPS, region `sin1`) with a Supabase database and Storage in Singapore, so it no longer depends on the QA laptop being on. IT/DPO approved putting ticket data in the cloud.
- **Removed:** the paused AI workbench (pages, `lib/ai` and the other workbench code, its tables and packages), the DAR **PDF** download (Print and Excel stay; *Save as PDF* in the print dialog still makes a PDF), the LAN scripts and the old SQLite database (`prisma/dev.db`). We started fresh in Supabase; no old data was copied.
- **Database:** Postgres through Prisma's `adapter-pg` (`lib/db-client.ts`). Row Level Security is on for every table with no policies, so Supabase's public API reads nothing. Sign-in limits are counted in the database (`RateLimitHit`), because serverless functions share no memory. Tests run on PGlite, an in-memory Postgres.
- **Uploads:** the browser uploads straight to the private `attachments` bucket with a signed URL (Vercel caps requests at 4.5 MB). The server then checks the real type, size and video length before a ticket can use the file. Files open through `/files/[id]`, which checks access and redirects to a 1-hour signed URL. Videos: up to 3 min / **50 MB** on the free plan.
- **Daily clean-up:** `/api/cron/daily` (02:00 Manila, protected by `CRON_SECRET`) removes unsent uploads, expired sessions and old sign-in counters.
- **Backups:** `npm run backup` now pulls from Supabase into **Documents\QA Hub Backups** (`Database\QA Hub database <date> <time>.json`, last 14 kept, plus `Files\`). New `npm run restore` loads one into an empty project. Logic in `lib/backup.ts`, with a round-trip test.
- **Also:** an image gallery on tickets (← → keys and buttons across every image on the ticket), the sign-in page's brand panel in dark mode, a sidebar fix for narrow windows, and `scripts/reset-password.ts` for a locked-out admin.
- **Docs:** `CLAUDE.md` rules rewritten for the cloud, `docs/OPERATIONS.md` rewritten, `.env.example` added.

## DAR on long bond paper, in the form's own colours (2026-10-29)

- **8.5 × 13 in (long bond), landscape, one page:** Print, the PDF and the Excel download all use the office's long bond paper.
  - The Excel file is set to Folio 8.5 × 13 in (Excel paper size 14), landscape, "fit to 1 page wide by 1 tall" (`longBondOnOnePage` in `lib/dar/excel.ts`). I checked it in Excel, which reports 1 page.
  - Its duty and MFO rows are sized to their text, so nothing is clipped.
- **Even 0.5 in margins, no browser headers:** the page margin is 0 and the HTML pads 0.5 in on every side, so the browser has no room to print its date, title, URL and page number in the corners. Only the sheet shrinks to fit, never the margins.
- **Colours kept when printing:** `print-color-adjust: exact`, so the fills print even with the browser's "Background graphics" off.
- **Exact colours** from the DCWD DAR workbook's styles (`DAR_COLORS` in `lib/dar/html.ts`):
  - **#FFCC99:** header labels, the MFO header, the day headers and "B.) SUPPORT FUNCTION".
  - **#FBD4B4:** "A.) CORE FUNCTIONS".
  - **#808000 (olive):** the address line.
  - The title is in **Book Antiqua**, bold.
  - The same colours are used on screen, in print, in the PDF and in Excel.

## My DAR looks like the paper form, and prints (2026-10-29)

- **My DAR is now the form itself:** a white sheet laid out like the DCWD *Project-Based Employee Daily Accomplishment Report*.
  - It has the seal and agency banner, the orange-labelled header table, the date submitted and days attended, and the DAYS grid with core and support functions and MFOs. The signatories are at the bottom.
  - **Editing:** click any day cell to type in it. Click the date submitted to pick another date.
  - The DAR page uses the full width of the screen (other pages keep the 1320px cap). The sheet keeps its paper proportions and zooms to fill it, shrinking on small screens and growing on wide ones. The separate preview is gone, since the page is the preview.
- **Print** button: prints the sheet as it is now, saved or not, scaled to one landscape Legal page. It uses the same layout as the PDF (`lib/dar/html.ts`, `PRINT_PAGE`).

## My DAR: Daily Accomplishment Report generator (2026-10-29)

- **My DAR** (QA testers only) builds the DCWD *Project-Based Employee Daily Accomplishment Report* for a half-month period (1–15, or 16 to the end of the month).
  - **Days filled from ticket work:** each day lists the modules of the tickets the tester filed, replied on or moved that day, by their **Code** from Team & modules, e.g. "QA - BCA / CRM".
  - A day with nothing is **REST DAY**, and every cell can be edited.
  - Days attended are counted live.
  - Drafts are saved per period. **Refill from tickets** redoes the auto-filled rows and keeps the others.
  - **Download Excel or PDF** in the form's layout: seal, header table, the days grid, core and support functions with MFOs, and the three signatories.
  - The PDF is printed from the same HTML as the on-screen preview and scaled to one landscape Legal page.
  - **My details:** the tester's full name for the form (accounts only hold a nickname), their position, and optionally their own duties and MFOs.
  - **Private:** a DAR is visible only to the tester who made it (`dar.use`, QA only). The export route returns only the caller's own report.
- **Admin → DAR template** (`dar.template`): department, unit, default position, signatories, and the core and support duties and MFOs. Admins choose which rows are filled from ticket work.
- **Code:**
  - `lib/dar/`: `period`, `autofill`, `template`, `store`, `html`, `excel` (`write-excel-file`, with the seal) and `pdf` (Playwright's Chromium).
  - Models `DarProfile` and `DarReport` (migration `dar_reports`).
  - No AI is involved (rule 12).

## Ticket progress tracker, full-width forms (2026-10-29)

- **Progress tracker** at the top of every ticket, the same for QA and the developer: Filed → In progress → Fixed → Verified → Closed.
  - Done steps get a tick and the current one a ring, and each shows when it was reached.
  - **Needs info** and **Reopened** appear on the In progress step. **Rejected**, **Duplicate** and **Won't fix** end the flow early, and the steps they skipped are struck through.
  - A "Waiting on …" line names whose move it is and what to do, e.g. "Waiting on Ana (QA) to retest the fix."
  - The logic is `ticketFlow` in `lib/tickets/flow.ts`, with unit tests.
- **Forms use the full width:**
  - **New ticket:** on wide screens, the main fields sit on the left and a Details panel (module, severity, priority, developer, File ticket) on the right. The edit dialog keeps one column.
  - **My account:** the profile and Change password sit side by side.
  - **Admin → Workspace:** the card fills the width.

## Phase 3.5b, slice 2: videos on tickets (2026-10-29)

- **Add video** on the new-ticket form and in the reply box: one MP4 or WebM per post, up to **3 min and 150 MB**.
  - The video uploads as soon as it's picked or dropped, with a progress bar and Cancel. The form then sends only its id, so a big video never goes through a Server Action.
  - Send and File ticket wait until the upload is done, and the browser asks before you leave mid-upload.
  - The browser checks the type, size and length first, so a too-long or too-big file is refused before it uploads.
- **Upload route** `POST /uploads/video` (`app/(main)/uploads/video/route.ts`):
  - It checks the session itself; `proxy.ts` skips this path so the proxy doesn't buffer or cut off 150 MB.
  - The body streams straight to `UPLOAD_DIR` as a `.part` file and never sits in memory.
  - The type comes from the first bytes (`sniffVideo`): MP4 or WebM. QuickTime `.mov`, Matroska and anything else are refused.
  - The size is counted as it arrives. The length is read from the MP4 `mvhd` box or the WebM `Duration`, without decoding (`lib/uploads/video-meta.ts`).
  - A refused, failed or cancelled upload leaves no file behind.
  - Uploads wait in `PendingUpload` until a ticket or reply claims them, and only the uploader can claim one. Unclaimed ones are removed after 24 h.
- **Playback with Range requests:** `/files/[id]` answers `Range` with `206` / `416` and `Accept-Ranges: bytes` (`lib/uploads/range.ts`), so a developer can scrub a recording without downloading all of it.
  - Videos play inline in the description and the thread, with name, length and size.
- **Activity log:** names videos too, e.g. "Attached 1 screenshot and a video" or "Posted a video". The delete dialog counts screenshots and videos.
- **Data:** a new `PendingUpload` model and `Attachment.durationSec` (migration `ticket_videos`).

## Tickets per person, delete, activity log (2026-10-29)

- **Each person sees their own tickets:**
  - QA testers see the tickets they filed, and developers the tickets assigned to them. Admins see everything (`tickets.viewAll`).
  - The rule is `ticketScope` in `lib/tickets/workflow.ts`. It applies to the list, the ticket page, the dashboard, attachment downloads (`/files/[id]`) and every change.
  - Anyone else's ticket looks like it doesn't exist. List filters can narrow a person's scope but never widen it.
  - Reassigning a ticket takes it off the previous developer's list.
- **Only QA testers (their own tickets) and admins** can file, edit and delete tickets. Developers have no "New ticket" button, and `/tickets/new` is not found for them.
  - Verify, close and reopen now belong to the QA tester who filed the ticket, since other testers can't see it.
- **Delete, permanently:** a red Delete button on the ticket, for the filing QA tester or an admin.
  - The dialog lists what will be removed: the ticket, its replies, its log and its screenshots.
  - The red "Delete this ticket" button stays disabled until the exact title is typed, as on GitHub. The server checks the title too.
  - Screenshot files are removed from `UPLOAD_DIR`.
  - Ticket numbers are never reused after a delete (`tickets.lastNumber` in `Setting`).
- **Activity log** on every ticket (`lib/tickets/log.ts`): every movement with its exact date and time, newest first.
  - It covers filing, status moves (with notes), assignments, edited fields, replies and attachments.
  - It is built from existing data, so older tickets have a full log too.
- **Dashboard per person:**
  - **QA:** My open tickets, Developer needs info, and Ready for my retest.
  - **Developers:** Assigned to me, Not started, and Waiting for QA retest.
  - **Admins:** the totals.
  - Each dashboard also lists that person's most recent tickets.
- **Ticket list:** titled "My tickets" or "All tickets", with views for each role. The Developer filter is hidden for developers.
- **Sub-modules:** the add/edit form no longer has a Sort order field. New sub-modules go after their siblings, and top-level modules keep the field.
- **Dark mode:** red (destructive) buttons use dark text, so they stay readable.

## Light/dark mode and theme colours (2026-10-29)

- **Mode:**
  - A sun/moon button in the topbar switches between light and dark.
  - The account menu has **Appearance → Mode**: Light, Dark, or System (follows Windows; the default).
  - Built on `next-themes` with the existing dark tokens. The choice is remembered per browser.
- **Theme colour:** six accents in the account menu: DCWD indigo (default), Ocean blue, Teal, Green, Violet and Rose.
  - Everything accent-coloured follows the choice: buttons, the active sidebar item, tabs and links.
  - It is one CSS value (`--acc-base`, set by `data-accent` on `<html>`).
  - A tiny script in `<head>` applies the saved colour before the page paints, so there's no flash.
  - Every accent keeps white button text at WCAG AA contrast in light mode (checked by `tests/unit/theme.test.ts`). Dark mode lightens it and uses dark button text.
- **Dark-mode fixes:** inactive sidebar links were nearly invisible, and white text on accent-coloured surfaces now uses the theme's button-text colour.
- **Sidebar:** removed the "Office network only / Ticket data never goes to an AI model" footer.

## Sign-up with admin approval, and the account menu in the topbar (2026-10-29)

- **Sign in / Sign up switch** at the top of both screens (`app/login/auth-tabs.tsx`), after the CRM portal's AuthTabs: a segmented control whose tabs are links, with the active pill popping in (off under reduced motion).
- **Create an account** (`/login?mode=signup`):
  - Choose QA tester or Developer, then enter a nickname (2–40 characters; shown on tickets and replies) and email. There is **no password field**.
  - When an admin approves, QA Hub creates a one-time **temporary password** (shown once, like Reset password). The person must choose their own at first sign-in.
  - Until then the account has a random password nobody knows, so it can't be signed into.
  - Nobody can sign up as an admin.
  - Only `@davao-water.gov.ph` addresses are accepted, here and when an admin adds or edits a user (`EMAIL_DOMAIN` in `lib/schemas/user.ts`). Subdomains and look-alikes such as `…gov.ph.example.com` are refused.
  - The account is saved turned off and **pending** (`User.pending`) until an admin approves it.
  - The form answers "Request sent" whether or not the email already has an account, so it can't be used to look people up. An existing account is never changed.
  - Sign-ups are limited to 20 per hour across the office.
- **Admin → Users** has a "Waiting for approval" list with Approve and Reject.
  - Reject deletes the request, and the person can sign up again.
  - Approve is the only way to turn a request on, because it creates the password.
- **Nickname everywhere:**
  - Admin → Users' New user / Edit user dialog and the users table say **Nickname** (2–40 characters), matching sign-up.
  - Both forms use the same rule (`NICKNAME_MAX` in `lib/schemas/user.ts`).
- **Temporary password box** (Approve, New user and Reset password):
  - The password starts hidden. **Show/Hide** toggles it, and **Copy** works either way, with a fallback for plain-HTTP LAN browsers.
  - Closing before copying or showing it, by Done, X, Esc or a click outside, asks first: "You haven't copied the password yet", with **Close anyway** or **Go back**. The shared guard is `components/close-guard.tsx`.
  - The Approve dialog lives at page level (`ApprovalHost`), so it stays open when the approved request leaves the list.
  - The dashboard tells admins how many requests are waiting.
- **Account menu:**
  - The large profile block is gone from the sidebar.
  - The signed-in person now shows at the right of the topbar (initials avatar, name, role). Clicking it opens **My account** and **Sign out**.
- **Migration:** `user_signup` adds `User.pending`.

## Phase 3.5b, slice 1: Tickets (2026-10-29)

QA and developers can now file and work tickets in QA Hub instead of Messenger.

- **Tickets** (`/tickets`):
  - Each ticket is a bug, suggestion or improvement, numbered #1, #2…
  - Fields: title, description, module or sub-module, severity (bugs only, S1–S4), priority (P1–P4), "found in" and the assigned developer.
  - Anyone signed in can see and comment on every ticket. Developers can file suggestions too.
- **Workflow** (`lib/tickets/workflow.ts`):
  - The assigned developer moves a ticket to In progress, Needs info, Fixed, Rejected, Duplicate or Won't fix.
  - Any QA tester can verify, close or reopen. The reporter can resume a ticket after adding info, or withdraw a new one.
  - Admins can do both sides.
  - Needs info, Rejected, Won't fix, Reopen and Withdraw require a note. Duplicate requires the other ticket's number.
  - A move is refused if someone else changed the status in the meantime.
- **Picking the developer:** QA and admins pick the developer. People who work on the chosen module are listed first, with the lead marked.
- **Ticket page** (`/tickets/[number]`):
  - Status buttons with a note dialog, and a details panel with the developer picker.
  - One conversation that mixes comments with a timeline of every change (status, developer, edited fields).
  - The reporter or an admin can edit the ticket.
- **Images:**
  - Paste a screenshot (Ctrl+V), pick files or drop them: up to 6 images of 10 MB each, on new tickets and on replies.
  - The type is checked from the file's bytes (PNG, JPEG, WebP or GIF).
  - Files are stored in `UPLOAD_DIR/YYYY/MM/<random>.<ext>` and served only through the signed-in route `/files/[id]`, with `nosniff` and a sandbox CSP.
- **List:** quick views (Open, Assigned to me, Reported by me, Waiting for retest, Done, All), filters by type, module (including its sub-modules) and developer, and a search on text or `#number`. 50 tickets per page.
- **Dashboard:** counts for open tickets, tickets assigned to me and tickets waiting for retest. These replace the "coming next" banner.
- **Config:** `serverActions.bodySizeLimit` and `proxyClientMaxBodySize` are raised to 64 MB. Without the second, `proxy.ts` would cut uploads off at 10 MB without an error.
- **Build fix:** `npm run build` had been failing on `/test-design/[id]` since 3.5a.
  - The layout's Suspense fallbacks read `usePathname()`, which the prerendered shell of a `[param]` route can't know.
  - The fallbacks are now `AppSidebarShell` and `AppTopbarShell`, which don't read the path.
- **Migration:** `qa_hub_tickets` adds the `Ticket`, `TicketComment`, `TicketEvent` and `Attachment` tables.
- **Tests:** workflow, ticket store (numbering, timeline, filters, the full loop), uploads (magic bytes, limits, path traversal), ticket schemas and formatting.

## Phase 3.5a: QA Hub foundation (2026-10-28)

The app's focus moves to a QA ticket hub for the 5 QA testers and the developers, on the office LAN. The AI workbench
is hidden behind an admin toggle while it waits for a major revision; none of it was deleted.

- **Accounts:**
  - Admin / QA tester / Developer roles, created by an admin. There is no sign-up.
  - New accounts get a 12-character temporary password and must change it at first sign-in.
  - Passwords are hashed with Node's built-in scrypt, so no native modules are needed.
  - Sessions are DB rows keyed by the SHA-256 of a random token in an httpOnly `qa_session` cookie. They last 14 days and slide while in use.
  - Failed logins are rate-limited (5 per email per 15 minutes) and get one generic error message.
  - `?next=` is limited to same-site paths.
- **Access checks:**
  - `lib/auth/session.ts` (`requireUser`, `requireAction`, `getCurrentUser`) runs in every page, Server Action and route handler.
  - `proxy.ts` only redirects visitors with no cookie and keeps the cookie fresh.
  - All permissions live in one matrix in `lib/auth/permissions.ts`.
- **Admin → Users:**
  - Create users, edit name, email and role, turn an account off (signs it out everywhere), and reset passwords.
  - Admins can't turn off their own account, and the last active admin can't be removed.
- **Admin → Workspace:** the AI workbench toggle, off by default.
  - When on, a separate "AI workbench" menu group appears for admins only.
  - Its pages moved to `app/(main)/(ai)/` behind `requireAiWorkbench()`. Their actions and routes check it too, and return 404 otherwise.
- **Team & modules** (`/team`): the who's-who directory.
  - It is an admin-editable module → sub-module tree (`ErpArea`, kept to two levels) with a lead, developers and QA per area (`AreaMember`).
  - Anyone can view it and filter by person. The dashboard flags developers and QA who aren't in any module.
  - The seed loads 4 placeholder modules from `data/erp-areas.json`, to be replaced with the real ERP module list.
- **Navigation:**
  - The sidebar now has three groups: Tickets (Dashboard, Tickets and Inbox are marked "Next", Team), Admin, and AI workbench.
  - The app is renamed QA Hub. The topbar shows the signed-in user and a sign-out button.
- **LAN operations** (`docs/OPERATIONS.md`):
  - New scripts: `npm run serve` (port 3000 on all interfaces), `npm run lan:dev` (with `LAN_ORIGINS`), `npm run user:create` and `npm run backup`.
  - `npm run backup` writes a `VACUUM INTO` snapshot, keeps the last 14 and mirrors `UPLOAD_DIR`.
  - SQLite now runs in WAL mode with a 5-second busy timeout.
- **Real ERP modules:**
  - `data/erp-areas.json` now holds the 11 DCWD ERP modules from the portal, with sub-modules for Human Resource (7) and Billing and Collection (2).
  - `npm run areas:import` re-syncs the file. It matches by code, so renames keep their members. `--prune` removes only areas that nobody is assigned to.
- **Show/hide password** button on every password field (`components/password-input.tsx`).
- **DCWD Careers design**, copied from the Careers prototype:
  - **Sign-in page** (split screen):
    - A brand pane with the DCWD seal (`public/dcwd-seal.png`), rings, a ripple and drifting waves. The motion turns off under reduced-motion settings.
    - The form has leading icons, 48 px fields and an eye toggle, with a footer bar below.
    - On phones the brand pane collapses to a small seal header.
  - **Sidebar:**
    - The seal with "DCWD / QA HUB", a centered profile block (initials avatar with an accent ring, name, role) that opens My account, and 40 px menu items.
    - The topbar now holds a labeled Sign out button.
- `proxy.ts` no longer intercepts `.png`, `.svg` and `.ico` files from `public/`, so the seal loads before sign-in.
- **Rules:** CLAUDE.md rule 6 now means "office LAN, behind login". New rules 12–14 cover ticket data never going to an LLM, uploads outside the repo, and the AI workbench gate.

## Phase 3: Test design studio (2026-10-26)

- **Requirements** at `/test-design`: paste, or upload `.md`, `.txt`, `.docx` (mammoth) or text-layer `.pdf` (unpdf). Limits are 5 MB and 60k characters. Uploaded text is shown for review before saving.
  - A requirement can be linked to a module and a business process. The process steps go into the prompt.
  - A **Sensitive** flag routes the text through redaction. "Preview what the cloud sees" shows the masked text on this machine only.
- **AI drafts** (`testcase_generation`, `claude-sonnet-5-5`):
  - The job is queued in `GenerationJob`, runs after the response through `after()`, and the page polls `/test-design/jobs/[id]`. A job cut off by a restart is marked failed after 10 minutes.
  - The prompt (`lib/ai/prompts/testcase-generation.ts`) sends the glossary and process steps, and asks for ≥ 15 cases with technique labels, ±1 boundaries, negatives and state transitions.
  - The model must write "unknown" plus an open question instead of inventing a rule, and must **never compute money**: amount expectations name the oracle or recon check.
  - Output is validated per case (`lib/test-design/normalize.ts`), so one bad case is dropped instead of failing the run.
  - Error messages never echo the requirement text or the SDK request body.
- **Editable grid:** expand a row to edit it, or add a case by hand. Bulk actions: approve, back to draft, mark obsolete, delete drafts.
  - Editing an approved case sends it back to draft. Automated cases are read-only.
  - A coverage strip shows counts by technique and warns below 15 cases or when boundary or negative cases are missing.
- **Traceability matrix** at `/test-design/traceability`: requirement → cases → latest result → defects, filterable by module. Uncovered requirements are flagged.
- **Export:** XLSX (`write-excel-file`, chosen over exceljs, which pulled in 94 packages including a flagged `uuid`) and CSV with a UTF-8 BOM. CSV cells that start with `=`, `+`, `-` or `@` are escaped, so tags like `@critical` are never run as formulas.
- **Seed catalog** in `data/seed-catalog.json`: 21 areas and 86 cases from PLAN §6.4 plus the BCA workflows (meter-reading books, JMS sequence gate, MCR, NSC, Order of Payment, BAM/DM/CM). The import is idempotent.
- **Reference docs:** `docs/erp/bca-api-process-flow.md`, a new `docs/glossary.md` (sent with every generation prompt) and a `docs/roles.md` stub to fill in.
- **Seed:** six new BILLING processes from the BCA document.
- **Schema:**
  - `Requirement` gets a title, module, process, source file and open questions.
  - `TestCase` gets open questions, a process step, a sort order and an approval time.
  - New `GenerationJob` table.
- **Next 16 note:** with Cache Components on, route handlers always run on Node.js and a `runtime` export is rejected, so CLAUDE.md rule 5 is met without the export line.

## Phase 2: AI layer (2026-10-26)

- **One router** in `lib/ai/` with entry point `runTask` (`lib/ai/index.ts`). ESLint blocks importing `ai`, `@ai-sdk/*`, the providers or the raw router from anywhere else.
- **Privacy per task:** `localOnly`, `redactThenCloud` or `public`.
  - Sensitive input never reaches the cloud unredacted.
  - Local-only tasks can't be rerouted, even from Settings.
  - If Ollama is down, the call fails instead of falling back to the cloud.
  - `OLLAMA_BASE_URL` must be a loopback address.
- **Redaction** (`lib/ai/redact.ts`), deterministic, with 57 tests:
  - email, PH mobile and landline numbers, TIN, SSS, PhilHealth, Pag-IBIG and GSIS numbers
  - labeled account, meter and OR numbers
  - peso amounts and long digit runs
  - a names list matched in any letter case, with or without accents or ñ, and in "Surname, Given" order
  - extra ID formats as regexes
  - an optional second pass with the local model, which refuses the cloud call if Ollama is down
- **Audit log:** every call (local and cloud, including `BLOCKED` and `ERROR`) records task, model, tokens, cost in integer micro-dollars, duration and redaction count. Prompt and response text are never stored.
- **Budget:** a $10/month cloud cap by default, checked before every cloud call, plus a limit on output tokens per call. Prices live in `data/model-prices.json`.
- **Settings page:**
  - provider health with "Test" buttons
  - models per task
  - budget and spend meter
  - redaction settings with an offline "Try redaction" preview
  - audit-log viewer with filters
- **AI SDK v7 note:** `generateObject` is deprecated, so structured output uses `generateText` with `output: Output.object({ schema })`, and `system` is now called `instructions`.
- **Dev fix:** `lib/db.ts` rebuilds its cached Prisma client after `prisma generate`, so migrations no longer require restarting the dev server.

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
