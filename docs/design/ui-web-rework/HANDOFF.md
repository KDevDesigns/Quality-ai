# UI (Web) Rework: developer handoff

**Status: ready to build.** The boards were approved on 2026-11-05 (canvas version 76), and every decision in section 1 is
made. Build in the order in section 2.

| Read this | For |
|---|---|
| The [canvas](https://claude.ai/artifact/4FM6sNF7gXezWyPrwkS7tB) (press Play) | What it looks like. This is the live design. |
| `*.dc.html` in this folder | Exact sizes, copy and sample states. A copy of the approved canvas (version 76, 2026-11-05). |
| `README.md` | New features, and the full rules for Module progress. They are not repeated here. |
| This file | How the boards meet the real app: what to keep, change and add, and what the boards don't show. |

The decisions in section 1 come first, including where they differ from a board. After those, if this file and a board
disagree on the look, the board wins. If they disagree on behaviour, permissions or data, the code in `lib/` wins.

**The boards are prototypes.** Their data is sample data and their logic is not app logic. Rebuild the look with the
app's own components; don't copy the markup. Section 9 lists what must not be copied.

---

## 1. Decisions

All decided on 2026-11-05. D12 follows the approved board; the owner accepted the recommendations for the others.

**Where these differ from the approved boards** (the boards themselves were not redrawn):

| Board | Build this instead | Decision |
|---|---|---|
| New ticket | No UI/UX type card or Approved design field yet. The UI/UX category stays | D3 |
| New ticket | No asterisk on Developer or Device type | D8 |
| Dashboard | My DAR in the menu for every role; the board hides it for Developer and Admin | D2 |
| Dashboard | Progress cards are links for admins only | D6 |
| Sign in | No "Office network only" text | D10 |
| Users | A confirmation before Reject | D9 |
| Profile menu | Appearance added above My account | D4 |
| All | The three contrast fixes in section 8 | D11 |
| All | Charcoal dark mode instead of navy, with borders in the theme colour | D14 |
| All | Severity and priority in red, orange, blue, grey | D15 |
| New ticket | Fills the window on laptops; Details card wider, in two columns, in a new field order | D16 |
| New ticket | Found in is a select, not text | D17 |
| Dashboard | Each module card has a score dot and percentage; rows use five colours and show 0% instead of "No tickets yet" | D19 |
| Ticket | Details sits above Report in the main column, as grouped columns (label over value); the side column holds only the Activity log | D20 |
| Ticket | No Next step box: the moves sit in the title row, whose move is one line under the title, Edit and Delete are in ⋯ More. On big screens the page fits the window | D21 |

| # | Question | Why it matters | Decision |
|---|---|---|---|
| D1 | What do phones look like? | Every board is desktop only. The app has its own phone layout: `BottomNav`, `/settings`, `PhoneTicketGroups`, `FilterSheet`. The design system's own rule below 900 px would put the sidebar on top and remove that. | Keep the phone layout and only give it the new tokens. New features still reach phones (section 7). |
| D2 | Who gets My DAR? | The Dashboard board shows it to QA testers only, and the Users board leaves it out for admins. `dar.use` in `permissions.ts` allows all three roles, and `navGroups` shows it to everyone. | Keep today's rule: everyone. |
| D3 | Do we build UI/UX tickets now? | The picker lists designs "approved in Design reviews", but Design reviews doesn't exist: no table, no pages, no board. Only the `designs.*` permissions and `User.designer` exist. Also, `tickets.create` leaves out developers, so a designer who is a developer couldn't file one. | Leave the UI/UX **type** out of this rework and build it with Design reviews. The UI/UX **category** still ships. |
| D4 | Where do light/dark and the theme colour go? | Today they are in the user menu (`user-menu.tsx`, `Appearance`). The new profile menu has only My account and Sign out, and no board has a place for them. Base DCWD also fixes the colour at `--primary`, while the app lets people pick one of six accents. | Keep Appearance in the profile menu, above My account, with light/dark and the six accents. Map `--primary` to `--acc`, so saved choices keep working and the default stays the DCWD colour. |
| D5 | Who may change a ticket's category? | The board says "Developer". The README only asks for "a permission". | The assigned developer or an admin: a new `tickets.categorize` action for `ADMIN` and `DEV`, plus the same per-ticket check as `devSide` in `workflow.ts`. |
| D6 | Where does a Module progress card link? | The counts cover **all** tickets in a module, but `/tickets` shows QA testers and developers only their own. A card saying "28 of 38" could open a list of 3. | A link for admins only. For everyone else it is a plain card with no hover. |
| D7 | What happens to accounts set to "Notify me silently"? | The option is removed from the page, but `SILENT` is still an enum value and accounts may hold it. | Change those accounts to `NONE` (Don't notify me), since both mean no noise outside work hours and the bell keeps everything. The data change still needs a backup, and a go-ahead just before it is applied. |
| D8 | Are Developer and Device type really required? | Both have an asterisk, yet both offer an empty choice ("Not assigned yet", "Not set"). Today both are optional in `lib/schemas/ticket.ts`. | Remove both asterisks and keep today's rules. |
| D9 | Should reject need a confirmation? | Approve has a dialog. Reject has none, but `rejectSignUp` permanently deletes the request. | Add a confirmation in the same dialog style. |
| D10 | Is "Office network only" still true? | It is on the Login board and the live sign-in footer, but the app runs on public Vercel. I found nothing in `docs/OPERATIONS.md` that limits it to the office. | Remove that phrase, on the page and in the live footer. |
| D11 | Approve the contrast fixes? | Three colours fail WCAG AA in the light theme (section 8). | Yes, apply them. |
| D12 | Keep "Search menu" in the sidebar? | It filters only 5 or 6 items. `PRODUCT.md` says to add nothing that doesn't help someone work. | Keep it, as on the approved boards. |
| D13 | When someone edits an older ticket with no module or category, must they set them? | The README requires both on new tickets only. `ticket-form.tsx` is shared by New and Edit. | Don't force it on Edit. Show "Not set" and let them choose. Only `createTicket` refuses. Category isn't in the Edit dialog: D5 decides who may change it, in the ticket's Details. |
| D14 | Which colours does dark mode use? | The owner found the navy too strong after seeing it in the app (2026-11-05). | A neutral charcoal (surface `#17181c`, page `#0e0f12`) replaces the navy values in section 4. Borders and control outlines mix in the person's theme colour. The sign-in page keeps its own colours. |
| D15 | What colours do severity and priority use? | Level 3 used `--primary`, which follows the theme colour, and looked close to level 4. | One fixed scale for both, the `--level-*` tokens: 1 red, 2 orange, 3 blue, 4 grey. It doesn't follow the theme colour. Used everywhere a severity or priority appears, always with its text. |
| D16 | How does New ticket fit the screen on a laptop? | Changing type moved the layout, because Bug has two more fields. | From 1280 px wide the cards fill the window, so the page doesn't scroll and a full card scrolls inside. The Details card is 440 px with two columns. Severity and Device type come last, so nothing above them moves. |
| D17 | Is Found in free text? | The owner wants a fixed choice. | A select: Dev, Staging, Production, or not set. Optional. Older tickets keep their free text, offered as an extra choice when edited. |
| D18 | Module dropdown | Sub-modules were hard to tell apart. | A tree: modules in bold, sub-modules indented under them. Once chosen, a sub-module shows as "Module › Sub-module". |
| D19 | How is a module's progress shown at a glance? | The owner wanted one indicator per module, and a module with 1 closed ticket shouldn't look 100% done (2026-11-05). | A dot and percentage per module: **score = closed ÷ the larger of (tagged tickets, 5)**, rounded down (`MIN_TICKETS` in `lib/tickets/progress.ts`). So 1 of 1 is 20%, 5 of 5 is 100%. Untagged, rejected, duplicate, won't fix and withdrawn tickets don't count. Colours for the dot and the category rows: 0 grey, 1–29 red, 30–59 yellow, 60–89 blue, 90–100 green. Category rows keep plain closed ÷ total, and 0 of 0 shows 0%. Cards sort by lowest score. |
| D20 | Where does Details go on a ticket? | The owner wanted Report and Details together, at the same width, with the log beside them (2026-11-05). | Main column: Details first, as a spec sheet with no boxes inside: three groups in columns (Assignment: Developer, Module · Classification: Category, Severity, Priority · Environment: Found in, Device type), label on top and value under it, then "Reported by · Filed · Closed" as one line along the bottom. Status isn't repeated; it is in the title row. Columns: three on a laptop, two on a tablet, one on a phone. Report under it. Side column: the Activity log alone, which stays in view from 1280 px wide. |
| D21 | Should ticket pages scroll on a big screen? | The owner wants the page itself never to scroll on their 1920×1080 to 2560×1440 screens; only cards scroll (2026-11-05). | A `desk:` variant in `globals.css` (at least 1600 px wide **and** 760 px tall). There the ticket is `100dvh − 12.5rem` tall, like New ticket: the header, steps and tabs keep their height; Report, the Activity log and the Conversation fill the rest and scroll inside. The Next step box is gone: its moves sit at the right of the title row, and Edit and Delete are in a ⋯ More menu. Its sentence ("Developer's move. Waiting on … to start work.") is the tooltip of the current step in the steps row, and each other step's tooltip says when it happened, or "Not reached yet"; phones, which can't hover, show it as a line under their step columns. Details and Report are one card (Details, the filed line, then Report), which on big screens fills the column and scrolls as one. Smaller laptops, tablets and phones scroll as a page. Later ticket pages follow the same rule: Tickets and My inbox do since Step C1. On Tickets the table's rows scroll under a sticky head with the pager below, and in Board view each column scrolls; in My inbox the list and the messages scroll inside the card. The view tabs' counts follow the active search, type, module and category filters; a developer chosen in the filters stays on across tabs except "Assigned to me". |

---

## 2. Suggested build order

One step at a time, reviewed before the next, as `CLAUDE.md` asks. This work continues the on-hold UI part of
`docs/PLAN.md` (3.7a). Give the steps phase numbers when they go into the plan.

| Step | Contents | Database |
|---|---|---|
| A | Tokens, app shell (sidebar, profile at bottom, topbar, waves footer), tooltip, button and pill styles | None |
| B | Notifications sidebar | None |
| C | Restyle with no new behaviour: Tickets, Inbox, Team, My DAR, DAR set-up, Markup | None |
| D | Ticket category: migration, `createTicket` rules, New ticket, Ticket detail with its two tabs, the Tickets category filter | **Yes** (back up and ask first) |
| E | Dashboard, with Module progress and its `lib/tickets/store.ts` function | None beyond D |
| F | Sign-up with own password, approval dialog, Users tabs, Sign in | None |
| G | My account tabs, removing Silent | Data change only (D7) |
| Later | UI/UX tickets and Design reviews (D3) | **Yes** |

Step A changes every page at once, so check all pages in both themes before moving on.

---

## 3. Sizes and layout

### Measure at 1920, write in rem

The boards are 2560 wide but are **1920 logical pixels, zoomed by 1.3333** (`tokens.css`, `@media (min-width: 2200px)`).
The app reaches the same result differently: `html { font-size: clamp(16px, 0.8334vw, 32px) }` in `globals.css`.

- Read every `px` value in a board as a value at 1920, and write it in rem (`px ÷ 16`).
- **Don't copy the `zoom` rule.** With both, big screens would scale twice.

### App shell

| Part | Token | Design | App today | Change |
|---|---|---|---|---|
| Sidebar | `--size-sidebar` | 280 px (17.5rem) | 17.5rem | None |
| Minimized sidebar | `--size-sidebar-collapsed` | 88 px (5.5rem) | 3.5625rem | Wider; expand button sits under the seal |
| Top bar and brand block | `--size-topbar` | 96 px (6rem) | Brand 4.5rem | Taller |
| Nav item | `--size-nav-item` | 44 px | 40 px | Taller |
| Brand text | | "QA Hub" 17/600, "DCWD ERP ticket hub" 12 | "DCWD" and "QA HUB" | New text |
| Search menu | | 40 px field under the brand; filters the nav items, hidden when minimized | None | New (D12) |
| Profile | | Bottom of sidebar, in view on long pages | Top bar (`user-menu.tsx`) | Moves |
| Page content | `--space-32` | 32 px padding, no maximum width | 40 px, `max-w-[82.5rem]` | Remove the maximum width |
| Page background | `--surface` | White | | `tokens.css` overrides `--page` for the shell |
| Footer | | 150 px animated waves **behind** the content, sticky to the bottom, no clicks | 52 px text bar | Replace; content gets 72 px bottom padding |
| Notifications | `--size-drawer` | 400 px third column | Dropdown from the bell | New (section 5) |

Sidebar groups: keep `navGroups()`, including the Admin group for admins. The Dashboard board leaves that group out, but
the Users board shows it. Keep the count badges on Tickets, My inbox and Users; the boards show only the inbox count.

Keep the app's own sidebar animation, Ctrl+B and saved state. The boards' `localStorage` code only exists for the
prototype.

### Page patterns

| Pattern | Spec | Used on |
|---|---|---|
| Page stack | Column, gap `--space-20` (Dashboard `--space-24`) | All sidebar pages |
| Page header | `dc-h1` + `dc-sub` on the left, actions on the right, gap 16; wraps | All sidebar pages |
| Main + side | Main `flex: 999 1 560px`, side `flex: 1 1 320px`, gap 24. The side column drops under when they no longer fit | Dashboard, Ticket, New ticket, Team, My DAR |
| Stat row | `repeat(auto-fit, minmax(220px, 1fr))`, gap 16 | Dashboard |
| Underline tabs | 48 px high, 15/500, 2 px underline `--primary` when selected, scrolls sideways if needed | Tickets, Ticket, Account, Users |

---

## 4. Design tokens

All values are in `ds/base-dcwd/tokens.css`, with `tokens.json` as the data form. Use the token names; don't paste values.
Dark mode's surface, text and border values below are replaced by D14; `app/globals.css` has the real ones.

**Don't run two palettes.** Change the values of the existing app tokens and add only the names that are missing:

| Design token | Light | Dark | App token | Used for |
|---|---|---|---|---|
| `--surface` | #ffffff | #141c55 | `--sf` | Cards, page |
| `--surface-subtle` | #f7f8fe | #111a4d | `--sf2` | Rest days, message area |
| `--surface-sunken` | #eef2fd | #1b2466 | `--sf3` | Board columns, gray pill, progress track |
| `--ink` | #1e2a78 | #eef2fd | `--tx` | Main text |
| `--ink-2` | #2a3170 | #d6dbf7 | `--tx2` | Report text, nav text |
| `--body-2` | #3d4580 | #c3c9ee | add | Labels on detail lists |
| `--muted` | #525a8c | #b3bbea | `--mu` | Secondary text |
| `--muted-2` | #8a90b8 | #5d669e | add | S4 dot, control outlines (D11) |
| `--line` / `--line-2` | #dde3f7 / #e8ecfa | #2a3373 / #212a68 | `--ln` / `--ln2` | Borders / row dividers |
| `--primary` | #4f56d3 | #5b62e0 | `--acc` (D4) | Main buttons, active nav |
| `--primary-text` | #4f56d3 | #a9b0f5 | add | Links, selected tabs |
| `--primary-hover` | #3f45c0 | #6b72ea | add | Hover |
| `--primary-tint` / `-wash` / `-border` | #eef0fc / #f6f6fe / #dfe2f8 | #252e7c / #19225f / #36408f | `--acc-t` / `--acc-t2` / `--acc-b` | Tinted areas |
| `--danger` / `-text` | #c42f2a both | #d2433d / #f07a74 | `--bad` | Errors, delete |
| `--danger-tint` / `-wash` / `-border` | #fdeeed / #fff8f7 / #f6d3d1 | #3a1e1f / #2a1819 / #5a2a2a | `--bad-t` / add / `--bad-b` | |
| `--success` / `-tint` / `-border` | #12805c / #e7f5ef / #bfe3d2 | #4cc79a / #16332a / #24503f | `--ok` / `--ok-t` / `--ok-b` | |
| `--warning` / `-tint` | #b45309 / #fff4df | #f0a24b / #3a2a12 | `--warn` / `--warn-t` | |
| `--pending-bg` / `-text` / `-border` | #fffbeb / #b45309 / #f7d56b | #2e2510 / #f4c24f / #6b5418 | add | Temporary password notice |
| `--table-head` / `--navy` | #edf1fb / #1e2a78 | #1b2466 / #c7ccf7 | add | Table headers |
| `--row-hover` | #f1f3fd | #1a2364 | add | Hover on rows |

**The sign-in page must not change colour.** The Login board keeps today's colours ("exactly as the app has it"), and it
uses the same names (`--tx`, `--mu`, `--ln`...). Before changing those values, fix the old values on a wrapper around
`app/login`, as the board's `.auth` class does.

**Other scales** (values in `tokens.css`):

- Space: `--space-4` to `--space-40`.
- Radius: `--radius-checkbox` 4, `-button` 8, `-input` 9, `-option` 10, `-list` 12, `-card` 14, `-modal` 16, `-pill` 999.
- Control height: `--size-button` 40, `-lg` 50, `-sm` 34, `--size-input` 44, `--size-icon-button` 38, `--size-pill` 24.
- Shadow: `--shadow-card`, `-hover`, `-dropdown`, `-modal`, `-focus`, `-nav-active`, `-stepper`.

**Type:** Geist and Geist Mono. The app loads its own fonts, so don't add the boards' Google Fonts link.

| Style | Size / weight | Used for |
|---|---|---|
| `dc-h1` | 28/600, -0.015em | Page title |
| `dc-h2` | 18/600 | Card title |
| `dc-sub` | 14.5, muted | Page description |
| `dc-label` | 14.5/500 | Field label |
| Body | 15, line height 1.5 | Default |
| Table head | 12.5/600, uppercase, 0.05em | Table headers |
| `dc-overline` | 12/600, uppercase, 0.06em | Section labels |
| `dc-mono` | Geist Mono, tabular numbers | Ticket numbers, emails, percentages |

**Status and severity colours** apply everywhere one appears:

| Status | Pill | Note |
|---|---|---|
| New | gray | App today is `info`; follow the board |
| In progress | blue | |
| Needs info | amber | |
| Fixed, Verified | green | |
| Reopened | red | |
| Closed, Rejected, Duplicate, Won't fix | gray | The last three aren't on a board; this is the app's rule |

Severity and priority dot: the `--level-1` to `--level-4` tokens, red, orange, blue, grey (D15). Bugs show severity; other types show
priority in the same place. Type text: Bug `--danger-text`, Suggestion `--warning`, Improvement `--primary-text`.

---

## 5. Components

### Design system to app

Style the app's existing component; don't add a second one.

| Design | Use in the app | Notes |
|---|---|---|
| `dc-btn` (default, `primary`, `soft`, `ghost-red`, `link`, `sm`, `lg`) | `components/ui/button` | Hover lifts 1 px; active presses down 1 px |
| `dc-input`, `dc-field`, `dc-error` | `Input`, `Field` | Focus: 2 px `--primary` + `--shadow-focus`. Error: 2 px `--danger`, `--danger-wash`, shake 0.42 s |
| `dc-select`, `dc-dd`, native `q-sel` | `SelectField` | Everywhere, including filters (section 9) |
| `dc-pill` | `status-pill` | |
| `dc-card` | `ui/card` | |
| `dc-table`, `role="table"` grids | `ui/table` | |
| `dc-modal` | `form-dialog`, `ui` dialog | Keeps focus handling |
| `dc-toast` | Sonner (`ui/sonner`) | Restyle. Stay bottom-right, so it doesn't block the page; the board's Undo depends on Sonner |
| `dc-stepper` | `ticket-flow.tsx` | Keep `lib/tickets/flow.ts` for the data |
| `dc-avatar` | `user-avatar` | Keep each person's photo or colour, not the board's single gradient |
| `dc-seg` | `view-switch.tsx` | |
| `dc-drop`, `dc-file`, `dc-progress` | `image-picker`, `video-picker` | |
| Eye button | `password-input` | |

### New shared pieces

| Piece | Props | Behaviour |
|---|---|---|
| `InfoTip` | `label`, `text` | 18 px info button beside a label. Shows on hover and focus. Background `--ink`, text `--surface`, 13/1.4, padding 8×10, width 260, 6 px above. Accessible name: "About {label}: {text}". Must stay inside the screen near edges |
| `Tooltip` styling | | Same look for icon buttons, the minimized sidebar and cut-off text. Goes below if there is no room above. Hides on scroll, click, Esc |
| `ClipText` | `children` | One line with "…", and shows the tooltip **only** when the text is really cut off |
| `NotificationsPanel` | none (reads `useNotifications`) | Below |
| `ProfileMenu` | `user` | Above the profile button. Width 248, padding 8. Appearance (D4), My account, Sign out in red |
| `ModuleProgressCard` | `name`, `parts`, `untagged`, `href?` | Dashboard |
| `MessageBubble` styling | `mine` | Mine: right, `--primary-wash`. Others: avatar 34, `--surface`. Max width 78%, 14.5/1.5, radius `--radius-list`. Style the existing `Message` |

### Notifications sidebar

| Item | Spec |
|---|---|
| Data | `useNotifications()`, which already polls `GET /api/notifications` every 30 s. It already gives number, title, actor and time. Show `count` for the total, since `items` is only the newest 8 |
| Row | Unread dot; title on one line (14.5/500) with "…"; below, `#number · who · ago` (13, muted). `actorName` can be empty: leave that part out. Links to `/tickets/{number}` |
| Header | "Notifications", "{n} unread" or "Nothing unread", close button. Same height as the top bar |
| Footer | My inbox; Mark all as read, using the existing `markAllTicketsRead` (hidden when nothing is unread) |
| Empty | "You're all caught up." |
| Open and close | The bell toggles it, and shows selected while open. Close button and Esc also close it. Focus goes to the close button on opening and back to the bell on closing. It stays open while moving between pages. It does not trap focus, because the page beside it stays usable |
| Narrow windows | Under 1800 px wide, a full sidebar minimizes while the panel is open, and comes back when it closes unless the person changed it meanwhile |
| Phones | Full screen over the page, not a column (D1) |

**How the page adjusts while it is open.** `tokens.css` does this with selectors that read inline styles, such as
`[style*="flex: 999 1 560px"]`. Those can't be copied. Make `<main>` a CSS container (Tailwind `@container`) and let each page
respond to its own width. The result must be:

- Titles and labels stay on one line and end in "…". Messages, the ticket report and dialogs still wrap.
- Page headers keep title and actions on one line; the title gives way first.
- Filter rows stay one row and share the width.
- Detail lists always show the label in full; only the value gives way.
- New ticket's type cards go 2×2.
- Users hides the Modules column, with no sideways scrolling.
- The Team owners table shares the card instead of scrolling.
- Dashboard's modules card and My DAR's "This report" move under the main column.

---

## 6. Pages

Rules for every page: session checks stay as they are (`CLAUDE.md` rule 2); keep each page's `<Suspense>` and skeleton,
restyled; use `lib/format` for dates in Manila time. Sample names and dates on the boards are not copy.

### Dashboard: `app/(main)/page.tsx`, `Main.dc.html`

Shows each person what needs them now and how each module is doing.

| Area | Spec |
|---|---|
| Header | "Good morning, {first name}", changing with the Manila time of day. Line: today's date + a sentence for the role |
| New ticket | If `can(me, "tickets.create")` |
| Admin notice | "{n} sign-ups and {n} password reset requests are waiting for you." + Review requests, from `auth.adminRequests()`. Hidden at zero. Handle singular and plural |
| Stat cards | Whole card is a link; hover lifts 2 px and the arrow moves 2 px. Number 28/600 tabular |
| Ticket list | Rows 52 px: number + unread dot (72), severity dot, title (clipped), person (128), status (104), age (36). Unread title 600, others 500 |
| Second card | QA and Developer: My modules, with a Lead pill. Admin: Not in any module (who needs one). Linked to Team |
| Module progress | Filter, "{n} of {m} modules", grid `auto-fill, minmax(340px, 1fr)`. Rules are in the README |
| Progress row | Label 68, bar 6 px, percentage 40, "{done} of {total}" 64. Colours and the module score: D19 |

Stat cards by role:

| Role | Card | Link |
|---|---|---|
| QA | My open tickets | `/tickets` |
| QA | Developer needs info | `/tickets?status=NEED_INFO` |
| QA | Ready for my retest | `/tickets?status=FIXED` |
| Developer | Assigned to me | `/tickets` |
| Developer | Not started (new or reopened) | **No filter does this yet:** `status` takes one value. Add a filter, or open the Board view on To do |
| Developer | Waiting for QA retest | `/tickets?status=FIXED` |
| Admin | Total tickets | `/tickets?group=all` |
| Admin | QA testers, Developers, Modules | `/team` |

Not on the board:

| Case | Proposed |
|---|---|
| Nothing waiting | "No tickets are waiting for you." Don't show "Zero tickets" |
| Empty ticket list | "No tickets yet." + New ticket if allowed |
| Filter shows no module | "You are not in any module yet." Keep the filter so they can choose All modules |
| No modules at all | "No modules yet." Admin gets a link to Team |
| Module ties | After the lowest percentage, sort by name. Modules with no tickets go last |

Numbers only reach this page, never ticket text (README).

### Tickets: `app/(main)/tickets/page.tsx`, `Tickets.dc.html`

Only the QA view is drawn. Keep these from today's page:

- Title and description by role (`SCOPE_TEXT`).
- `quickViews(role)`, including the admin's Assigned to me and Reported by me.
- All filters in the URL, and the saved list or board choice.
- "by {reporter}" on rows for developers and admins, who need it even though the QA board omits it.
- The deleted-ticket notice and the existing empty-state wording.

**Board view: only the card's look changes.** Keep drag and drop, the Undo toast, assigning, "See all in the list", and
`BOARD_COLUMNS` (Done also holds Rejected, Duplicate and Won't fix, which the prototype drops). Dragging needs the existing
keyboard and menu ways of moving a card.

| Change | Detail |
|---|---|
| View chips become underline tabs with a count | Stay as links with `aria-current="page"`. **Counts need a new query** |
| Filters in a card with visible labels | Search, Type, Module, Developer. Hide Developer for developers, as today |
| Filter button removed | A select applies on change; search applies on Enter. Must still work as a plain form |
| **Add a Category filter** | The board has none, but the feature needs it for tagging older tickets. Include "Not tagged yet" |
| Row detail | Add category (or "Not tagged yet") |
| Pager | Numbered pages through `?page=`. Hide when there is one page |

### Ticket detail: `tickets/[number]/page.tsx`, `Ticket.dc.html`

Puts the ticket's state and the next move on top, then Details or Conversation.

**The board draws only Fixed, Verified and Reopened. Build it from the workflow, not the board:**

| Part | Source | Rule |
|---|---|---|
| Stepper | `lib/tickets/flow.ts` | Already handles Needs info, Reopened, skipped steps and ended tickets. Only the look changes. `aria-current="step"` stays |
| Next-step box | `flow.next` | Board copy where it exists, e.g. "Your move: retest this fix"; otherwise the current "Waiting on..." sentence |
| Action buttons | `allowedTransitions(ticket, me)` | Main moves as buttons; `back` moves (Stop work, Not fixed yet...) are never the main button |
| Notes | `Transition.needsNote` | **Reopen, Ask for info, Withdraw and others must ask for a note.** The board's Reopen doesn't |
| Close | Rule `VERIFIED → CLOSED` | **The board says "can now be closed" with no button.** It must appear |
| Duplicate | `needsDuplicate` | Asks for a ticket number; show the link to the original |
| Edit, Delete | `canEditTicket`, `canDeleteTicket` | The board always shows them |
| Developer field | `canAssign` | Editable for QA and admins, as today; text on the board |
| Category field | D5 | Select for those allowed, text otherwise, "Not tagged yet" when empty |

Other rules:

- **Tabs:** Details, Conversation with a reply count. **`ticket-tabs.tsx` already does this on phones;** laptops show every
  part at once today. Extend it to laptops instead of building new tabs. Keep what it has: `?tab=conversation` in the URL,
  and both tabs staying mounted, so **a half-written reply survives switching tabs** (the board's version would lose it).
  Default is Details. A link from a notification or inbox should use `?tab=conversation` (not on the board, but that is
  what the person came for).
- **Evidence:** real thumbnails through `/files/[id]` and the existing `ImageGallery`. The bracketed labels are sample text.
- **Conversation:** existing `Thread` and `CommentForm`; status events sit inline. Keep the description and its files where
  they are in the Report.
- **Activity log, newest first:** `TicketEvent` rows alone don't cover the board's lines. "Replied" comes from
  `TicketComment` and "added a screen recording" from `Attachment`, so the log merges three sources. A category change is a
  `FIELD` event with `field: "category"`.
- **Marking read:** keep `MarkRead`.

### New ticket: `tickets/new/page.tsx`, `ticket-form.tsx`, `NewTicket.dc.html`

| Field | Required | Rule |
|---|---|---|
| Type | Yes | Bug, Suggestion, Improvement (D3) |
| Title | Yes | 5 to 150 characters, from `ticketFields` |
| Description | No | Up to 20,000. The hint changes with the type |
| Screenshots and video | **Yes, new** | At least one |
| Module | **Yes, new** | "Not sure" is removed |
| Category | **Yes, new** | Front-end, Back-end, UI/UX |
| Found in | No | |
| Severity | Bugs | Dots in the select |
| Device type | No (D8) | Bugs only; keep `guessDevice` |
| Priority | Yes | Default P3 |
| Developer | No (D8) | Default "Not assigned yet" |

- **The server must refuse** a missing module, category or attachment, not only the page (README). Edit stays free of
  these (D13).
- **Upload box:** one box. Clicking it arms paste: 2 px `--primary`, `--primary-tint`, "Ready to paste. Press Ctrl+V."
  Non-image paste: "No image was copied. Copy a screenshot, then press Ctrl+V." in `--danger-text`. The message is
  `aria-live="polite"`. The logic exists in `image-picker.tsx`.
- **Hide Capture screen** where `useCanCapture()` is false.
- **Tooltip limits:** build the text from `lib/uploads/limits.ts`. The video limit comes from an environment variable, so
  the board's "50 MB" must not be hard-coded.
- **Not on the board, keep from today:** the list of added files with progress, remove and retry; drafts (add `category`
  to `DRAFT_FIELDS` in `lib/tickets/draft.ts`); Android share and its `?shared=missed` notice.
- **File ticket** is a real `<button type="submit">` with a pending state. The board's is a link.
- **Errors, not on the board:** `dc-error` under each field, plus the form's summary message. For attachments: "Add at
  least one screenshot or video." Focus the first field with an error. Fields keep their values.

### Screenshot markup: `tickets/markup/`, `Markup.dc.html`

Mostly a restyle: dialog 1180 wide, canvas area 470 high on `--sample-black`.

- Eleven tools with keys: Select V, Box B, Circle E, Arrow A, Pen P, Highlight M, Text T, Steps N, Callout K, Hide H,
  Crop C. Four colours, undo, redo, clear, zoom, Fit, Shortcuts.
- **Checked against the code:** the tool names, keys and hints match `TOOL_BUTTONS` in `shortcuts.ts`, and the four colours
  match `MARK_COLORS`. Read them from there; don't retype them. The colours stay literal because they are part of the image,
  not the theme.
- **The board's Shortcuts panel lists only 4 shortcuts. Keep the full `SHORTCUT_HELP` list** (colour keys, nudging, Delete,
  zoom, Esc and more), so nothing people use today disappears.
- Keep the guard for unsaved marks (the editor's own "Leave?" question behind its corner X; Esc and a click outside never
  close it), and the phone-sideways layout (`short` variant).
- Built (Step C2): the canvas height stays flexible (62% of the window, at least 240 px) instead of the board's fixed 470,
  so it keeps filling big screens. Fit and Shortcuts are text buttons; the Shortcuts panel lists every shortcut.
- The Hide tool's black box must be burned into the saved image. It protects customer data (`CLAUDE.md` rule 1).

### My inbox: `inbox/page.tsx`, `Inbox.dc.html`

Mostly a restyle; the page already has the same structure and wording. Keep the `?t=`, `?q=`, `?unread=` and `?n=` URLs,
Show more, and the phone's one-pane-at-a-time layout.

- **Don't open the first conversation automatically,** as the board does. Opening a ticket marks it read (`MarkRead`), so
  people would lose unread items by visiting the page. Keep "Pick a conversation".
- All and Unread become a segmented control with a count, still as links.
- Unread label is a red pill "{n} new", from the existing `unreadMessages`. Over 99: "99+ new".
- Keep `CommentForm`, not the board's one-line input: replies can be long and have images.
- Keep the ticket description as the first message, as today.

### Team and modules: `team/page.tsx`, `Team.dc.html`

- Left: module search, "Show modules for" person filter, module list. Right: owners table with Lead, Developers, QA.
- The person filter already exists (`?person=`), so keep it and its logic. Add the selected module to the URL the same way.
- Selected person's chips turn blue. An empty cell shows "None" as plain muted text.
- No match: "No module matches. Clear the search or choose Everyone."
- Admin buttons (Add module, Add sub-module, Edit module, Edit) open the existing `team-dialogs.tsx`. Everyone else sees none.
- Built (Step C2): the open module is `?module=` (the first in the list without it). The search also matches sub-module
  names and codes. Admins keep Members and Delete, on the module's header and on each row, though the board has neither.
  On big screens (D21) the module list and the owners table scroll inside their cards.

### My DAR: `dar/`, `Dar.dc.html`

- **A period is not always 15 days.** Oct 16 to 31 has 16 and Feb 16 to 28 has 13, but the board's strip is
  `repeat(15, ...)`. Use `periodDays()` and set the columns from its length, in the By day strip and the Official form.
- Day button: 64 high; weekday, number, green dot if filled. Selected: 2 px `--primary`. Today: label "Today". Rest days:
  `--surface-subtle`. Accessible name: "Wed Nov 4, filled".
- Day card pill: Filled (green), Empty, Rest day or Not yet (gray).
- Save button shows Save when changed and Saved when not. Keep both of today's unsaved-changes guards in `dar-editor.tsx`:
  the question when changing period, and the browser's warning when leaving the page.
- Print and Download Excel use the existing `dar-sheet` and `dar/export` route.
- **Wording:** the DAR board says "Core duties", the set-up board "A.) Core functions". Use the set-up wording throughout,
  as it matches the `coreFunctions` data. Confirm it matches the official form.
- **Date submitted** is plain text on the board ("Not yet"), but `dar-editor.tsx` lets people set it today and saves it to
  the report. Keep it editable in "This report".
- Not set up: the card "Set up your DAR", linking to `/dar/setup`.

### My DAR set-up: `dar/setup/`, `DarSetup.dc.html`

A restyle of `setup-form.tsx` and `functions-editor.tsx`. Sections: First period, Header, Signatories, Duties and MFOs.
Add errors with `dc-error` and keep the existing save result. Rows behave the same on the board and in
`functions-editor.tsx` today: Move up only, and Remove acts at once with no question, so keep that.

### My account: `account/`, `Account.dc.html`

- **Banner:** photo button 132, name, role and email over the banner image. **The image is only on the canvas**
  (`/_blob/3b52082e...`): export it to `public/`, or the page has no banner. Keep `AvatarUpload`.
- **Tabs change from a left list to underline tabs along the top,** and from five to four: Password moves into Profile.
  `?tab=password` is still linked from `/settings` and `nav.ts`, so it must open Profile. Update `ACCOUNT_SECTIONS`.
- **Temporary password:** the notice uses the `--pending-*` tokens, and Profile opens first. Keep the forced change.
- **Notifications:** on/off states, Send test, Install. Keep `install-card.tsx` and `device-push.ts`.
- **Sound:** the board shows Tone 1 to 3 and Silent, but the app has **11 tones**. Keep them all, and the Play button
  (`tone-select.tsx`).
- **Work hours:** two choices now. Update `OFF_HOURS_PUSH` in `lib/schemas/push.ts`, `lib/push/recipients.ts`, `send.ts` and
  `notifications-card.tsx` (D7).

### Users (Admin): `admin/users/`, `Users.dc.html`

- Tabs: Users, Approval, Password reset, with counts (amber when above zero). Keep the tab in the URL. The Dashboard's
  Review requests opens the tab that has items.
- Table columns: Nickname + "(you)", Email (mono), Role + Designer pill, Modules, Status, actions. Your own row has only Edit.
- Filters: search, Role, Module, Status. "{n} of {m} users".
- Status: Active green, Temporary password amber, Turned off gray. **Don't use the board's `opacity: .6` on turned-off rows:**
  it lowers the text below the contrast limit. The pill already says it.
- **Not on the board, keep from today:** `user-dialog.tsx`, `delete-user-dialog.tsx`, and the one-time temporary password
  result after New user and Reset password.
- **Approve:** dialog "Approve {name}?", then a toast "{name} can now sign in." Reject: D9. If someone else already handled
  it, show the existing "already handled" message.

### Sign in: `app/login/`, `Login.dc.html`

The brand pane and footer stay as they are, apart from D10. The change is in Sign up:

| Rule | Detail |
|---|---|
| Sign-up takes a password | `signup` and `signupInput` add password and confirm. Minimum `PASSWORD_MIN` on the server |
| `auth.signUp` | Stores the hash of **their** password, with `mustChangePassword: false`, still `active: false, pending: true` |
| `auth.approveSignUp` | No longer sets a password. Sets `active: true, pending: false` |
| **Requests already waiting** | These were created with a random password nobody knows, so plain approval would lock them out. They are the pending accounts with `mustChangePassword: true`. For those, keep today's temporary password flow |
| "Waiting for approval" notice | Show only when the password was **correct** for a pending account. Everything else keeps the single "Wrong email or password" message, so the form doesn't reveal accounts |
| Strength meter | Too short, Weak, Good, Strong, per the board's rule. It only advises; the server checks the length |
| Errors, not on the board | Passwords don't match: "The passwords don't match." Keep the existing email and rate-limit messages |
| Request sent | Board wording for sign-up and forgot password |

Keep `?mode=` and `?next=`. Add the `InfoTip` styles here too: this page doesn't load the shell.

---

## 7. Responsive

| Width | Behaviour |
|---|---|
| Over 1920 | Everything scales through the root font size. No layout change |
| 1800 and up | Notifications open beside a full sidebar |
| 768 to 1800 | Notifications minimize the sidebar while open |
| Under 1024 | Sign-in brand pane hides; small seal and name appear |
| Under 768 (`md`) | Today's phone layout (D1). Bottom tabs, `/settings`, card lists, filter sheet |

**Use the app's 768 px breakpoint, not the design system's 900 px rule.** Between them the sidebar stays, as today.

New features on phones, with no board (D1 keeps today's layout; this is how they fit into it):

| Feature | Phone |
|---|---|
| Module progress | Cards in one column on Home, below the stats |
| Category | A field on the phone form; a filter in the sheet; a line on ticket cards and Details |
| Ticket tabs | The existing "Ticket sections" control |
| Notifications | Full screen |
| Users tabs, Account tabs | Sideways-scrolling tabs on Users; Account stays opened from Settings |

---

## 8. Accessibility

`PRODUCT.md` names no standard. These are measured against WCAG 2.1 AA. Contrast was calculated from `tokens.css`.

**Colours to fix (D11):**

| Pair | Ratio | Needs | Fix |
|---|---|---|---|
| Placeholder on white, light | 3.11 | 4.5 | `--placeholder` → `--muted` (6.56) |
| Input border on white, light | 1.28 | 3 | Control outlines use `--muted-2` (3.11). `--line` stays for cards and dividers |
| Green pill, light | 4.38 | 4.5 | Text → #0f6e4f (5.56), the app's current `--ok` |

Passing: main text, muted text, links, buttons, the other pills, tooltips. Dark placeholder is 4.65. Dark `--muted-2` (2.91) is
acceptable only because the S4 dot always has text beside it, so never use it for text. Disabled controls are exempt.

**Rules:**

- **Colour is never alone.** Severity dots and unread dots need text or `sr-only` text; a `title` isn't enough.
- **Focus ring:** 2 px `--primary`, offset 2, on everything that can be clicked.
- **Targets:** icon buttons are 34 to 38 px on desktop. Keep today's 44 px on phones.
- **Icons:** decorative ones are `aria-hidden`; icon-only buttons have a name that includes the person ("Delete Grace Yu").
- **Hidden header text:** use `sr-only`, not the board's `color: transparent`.
- **Motion:** `prefers-reduced-motion` turns off all animation, including waves, the seal and ripples.

**Focus order:**

| Page | Order |
|---|---|
| Shell | Sidebar → minimize → breadcrumb → bell → page → notifications if open |
| New ticket | Type → title → description → upload box and its buttons → details from top to bottom → File ticket |
| Ticket | Edit and Delete → next-step actions → tabs → tab content |
| Dialogs | Focus stays inside; Esc closes; focus returns to the button that opened it |

**Announcements:** paste box messages (`polite`), form save results (`role="status"`), toasts, and the password strength text.
Form errors link to fields with `aria-describedby`, and the input gets `aria-invalid`.

---

## 9. Don't copy from the prototype

| On the boards | Why not | Instead |
|---|---|---|
| Custom dropdown (`dc-select` + `onMouseDown` + `onBlur`) | A keyboard can't use it: moving focus to an option closes the list | `SelectField` |
| `[style*="..."]` selectors in `tokens.css` | They depend on inline style text | Container queries (section 5) |
| `zoom: 1.3333` | Scales twice | The root font size |
| `shell.js` | DOM patching for the prototype | React components, and only its behaviour, as specified here |
| `role="table"` on grids | Harder to read for screen readers | `ui/table` |
| Tabs as buttons with `aria-current` | Wrong pattern for in-page tabs | Tab roles as in `account-tabs.tsx`, or real links |
| Links as form submit (`<a>` File ticket, Sign in) | Doesn't submit | Real submit buttons |
| Sample dates, names, `/_blob/` URLs, `.dc.html` links | Canvas only | Real data, `/dcwd-seal.png`, real routes |
| Two `@keyframes dc-pop` and two `dc-fade` in `bundle.css` | The later one silently wins, so a checkbox "pop" runs the menu's animation | One name per animation |
| `.dc-btn.loading` spinner on non-primary buttons | White on white | A spinner in `currentColor` |
| Any real ticket content in samples, tests or tools | `CLAUDE.md` rule 1 | Made-up data |

---

## 10. States and interactions

| Element | State | Behaviour |
|---|---|---|
| Button | Hover | Lifts 1 px, `--shadow-hover`; primary goes to `--primary-hover` |
| Button | Active | Down 1 px, no shadow |
| Button | Disabled | `--disabled-bg`, `--disabled-text`, not-allowed cursor |
| Button | Pending | Spinner, label kept for screen readers, can't be clicked twice |
| Nav item | Hover / active | `--row-hover`, icon moves 2 px / `--primary`, `--shadow-nav-active` |
| Table row | Hover | `--row-hover` |
| Whole-card link | Hover | Lift and `--shadow-hover`; the title link or card gets the focus ring |
| Input | Focus / error | See section 5 |
| Page | Loading | Existing skeletons, restyled |
| Action | Failed | Existing `InlineAlert` or field error. Keep what the person typed |

Gestures: board cards drag on desktop; nothing new on phones.

## 11. Motion

| Element | Trigger | Animation | Duration | Easing |
|---|---|---|---|---|
| Page | Load | Fade + up 12 px (`dc-fade-up`) | 340 ms | `cubic-bezier(.2,.8,.2,1)` |
| Button | Hover | Lift 1 px | 180 ms | same |
| Stat card | Hover | Lift 2 px; arrow moves 2 px | 200 ms | same |
| Nav icon | Hover | Moves 2 px | 220 ms | `cubic-bezier(.16,1,.3,1)` |
| Select arrow | Open | Turns 180° | 260 ms | `cubic-bezier(.2,.8,.2,1)` |
| Dropdown | Open | Fade + down 8 px | 260 ms | same |
| Notifications | Toggle | Column opens | 260 ms | same |
| Sidebar | Minimize | Keep the app's spring | 520 ms | `--sidebar-ease` |
| Profile menu | Open | Fade, up 16 px, scale .96 | 320 ms | `cubic-bezier(.16,1,.3,1)` |
| Dialog | Open | Fade + scale .97; scrim fades | 240 ms; 200 ms | same as page |
| Toast | Appear | Fade + up 12 px | 260 ms | same as page |
| Input error | Refused | Shake (`dc-shake`) | 420 ms | same as page |
| Footer waves | Always | Drift, 3 layers | 26, 18, 12 s | linear, infinite |

Reduced motion turns all of these off. The waves must use `transform` only, and take no clicks.

## 12. Edge cases and limits

| Case | Rule |
|---|---|
| Long title, list | Wraps on Tickets; one line with "…" and tooltip on Dashboard, notifications, inbox |
| Long title, ticket page | Always wraps |
| Long module path | Wraps on Tickets; `ClipText` in tight places |
| Long email | Mono; must not push the table wider than its scroll area |
| Name with no surname | Greeting uses the first word; nicknames can be one word |
| Many unread | "99+" |
| Hundreds of tickets | Pager on list; 50 per column on the board |
| Slow connection | Skeletons, pending buttons, per-file upload progress; pages work before any polling finishes |
| Poll failure | Notifications keep the last data, with no error shown |
| Missing photo | The person's colours and initials |
| Deleted person or no actor | Leave the name out; never show "null" |
| Ticket with no module | "Module not set". Counts in no progress card (README, Still to check) |
| Ticket with no category | "Not tagged yet"; left out of percentages, shown as "N not tagged yet" |
| Rights changed while open | The server refuses and the page shows the message |
| Longer text | English only today, but use flexible widths; don't fix a width to today's wording |

---

## 13. Done means

For each step:

- [ ] `npm run lint`, `npx tsc --noEmit`, `npx vitest run` all pass.
- [ ] Each role checked: Admin, QA tester, Developer.
- [ ] Light and dark, at 1366, 1920 and 2560 wide, and a phone at about 390.
- [ ] Notifications open and closed on every sidebar page, with no sideways scrolling on the page.
- [ ] Keyboard only: every action on the page can be reached and used.
- [ ] A Vitest test for every new `lib/` module, including the README's Module progress list.
- [ ] Older data checked: tickets with no module or category, pending sign-ups, `SILENT` accounts.
- [ ] Any migration follows `CLAUDE.md` and the README: RLS stays on, take a backup first, and ask before applying it.
- [ ] Samples use made-up data only.
