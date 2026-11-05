# UI (Web) Rework: design notes

This folder is a copy of the boards on the [QA Hub Redesign canvas](https://claude.ai/artifact/4FM6sNF7gXezWyPrwkS7tB),
copied at version 76, which was **approved on 2026-11-05**. If the canvas changes after this, copy it here again.
Build details are in `HANDOFF.md`.

- `*.dc.html` holds one board per page, with sample data.
- `ds/base-dcwd/` holds the Base DCWD Design System files the boards use, plus the shared sidebar and notifications
  behaviour (`shell.js`, `tokens.css`).
- These files are a reference for building. They don't run on their own: a board needs the canvas to draw it, and its
  images live on the canvas. To see a design, open the canvas and press Play.
- Nothing here is app code. The boards are approved; `HANDOFF.md` has the build order, the decisions made, and where they differ from a board.

## Boards

| Board | File | App page |
|---|---|---|
| Dashboard | `Main.dc.html` | `app/(main)/page.tsx` |
| Tickets | `Tickets.dc.html` | `app/(main)/tickets/page.tsx` |
| Ticket detail | `Ticket.dc.html` | `app/(main)/tickets/[number]/page.tsx` |
| New ticket | `NewTicket.dc.html` | new ticket page and `ticket-form.tsx` |
| Screenshot markup | `Markup.dc.html` | the screenshot markup dialog |
| My inbox | `Inbox.dc.html` | `app/(main)/inbox/page.tsx` |
| Team and modules | `Team.dc.html` | `app/(main)/team/page.tsx` |
| My DAR | `Dar.dc.html` | `app/(main)/dar/` |
| My DAR set-up | `DarSetup.dc.html` | `/dar/setup` |
| My account | `Account.dc.html` | my account page |
| Users (Admin) | `Users.dc.html` | `/admin/users` |
| Sign in | `Login.dc.html` | `app/login` |

## New features

| Feature | Board | Database change |
|---|---|---|
| Ticket category: Front-end, Back-end or UI/UX, required when filing | New ticket, Ticket detail, Tickets | Yes |
| Module progress: three percentages per module, with a filter | Dashboard | None beyond ticket category |
| UI/UX ticket from an approved design: **later**, with Design reviews (not in this rework) | New ticket | Yes: a `UIUX` ticket type and a link to the design. Design reviews has no board yet. |
| Own password at sign-up, approval with confirmation | Sign in, Users | Probably none |
| At least one attachment on every new ticket | New ticket | None |
| One upload box with Ctrl+V | New ticket | None |
| Ticket detail in two tabs: Details and Conversation | Ticket detail | None |
| Profile at the bottom of the sidebar | All sidebar pages | None |
| Notifications as a right sidebar; the page adjusts while it is open | All sidebar pages | None |
| Tooltips in the info icon's style | All sidebar pages | None |
| Users with Users, Approval and Password reset tabs | Users | None |
| Remove "Notify me silently" | My account | Accounts already set to it need a decision |

## How tickets connect to Module progress

This is the most important part to get right when building.

**There is one source of truth: the tickets themselves.** The percentages are never saved anywhere. The Dashboard counts
them from the `Ticket` table each time it loads, so they can't drift out of sync with the tickets. A change shows the next
time someone opens or reloads the Dashboard, not while it is already open.

### What each ticket needs

| Data | Where it comes from | Today |
|---|---|---|
| Module | `Ticket.areaId`, chosen on New ticket | Exists. `createTicket` must now require it on every new ticket, and "Not sure" goes away. The column stays optional in the database for older tickets. |
| Category | New `Ticket.category`: `FRONT_END`, `BACK_END`, `UI_UX`, chosen on New ticket | **New**, needs a migration. The column stays optional in the database for tickets filed before this; `createTicket` requires it on every new ticket. |
| Closed or not | `Ticket.status` | Exists. Don't use `isDone` in `lib/tickets/workflow.ts`: it also includes Rejected, Duplicate and Won't fix. |

### The calculation

For each active top-level module (`ErpArea` with no `parentId`):

1. Take its tickets: those on the module itself or on any of its sub-modules. Leave out Rejected, Duplicate, Won't fix and
   withdrawn tickets completely, so they count in neither number.
2. Group them by category.
3. For each category, percentage = Closed ÷ total, rounded down, so 100% only means everything is closed. Verified doesn't
   count until it is closed.
4. A category with no tickets shows "No tickets yet", not a percentage.
5. Tickets filed before Category existed have none. They show as "N not tagged yet" and are left out of the percentages
   until a developer tags them.

Sort the modules so the one with the lowest category percentage comes first.

### What changes the numbers

| Action | Effect |
|---|---|
| New ticket | Its category's total goes up, so that percentage drops right away |
| Developer corrects the category | The ticket moves to the other category, and both percentages update |
| Developer tags an older ticket | "Not tagged yet" goes down, and that category's percentage updates |
| Ticket is closed | Closed goes up, so the percentage rises |
| Ticket is reopened | Closed goes down if it was closed, so the percentage drops |
| Ticket is rejected, marked duplicate, won't fix or withdrawn | It leaves the total; it comes back if reopened |
| Ticket moves to another module | Both modules update |
| Ticket is deleted | It stops counting |

### Build rules

- Put the count in one new function in `lib/tickets/store.ts`, with a Vitest test. The Dashboard and any later page must
  call that function and not count on their own.
- It must count **all** tickets in a module. The existing `tickets.counts(me)` and `tickets.recent(me)` show only the
  viewer's own tickets, so they can't be used here. Only numbers reach the page, never ticket text.
- The filter uses `AreaMember`. An assignment to a sub-module counts for its top-level module.
- Withdrawn needs no new status or migration. Today a ticket reaches Closed only two ways: Close from Verified, or Withdraw
  from New or Needs info (`lib/tickets/workflow.ts`). So a Closed ticket is withdrawn when its latest `STATUS` event in
  `TicketEvent` came from New or Needs info. Check that older tickets' history fits this before relying on it.
- `createTicket` must refuse a new ticket with no module or no category, not only the page. Android share and the draft flow must still
  work. A UI/UX-type ticket sets its own category.
- Changing a category needs a permission in `lib/auth/permissions.ts`, a server check, and a line in the activity log.
- The migration adds an optional column, so existing tickets stay and start as not tagged. Take a backup first, and ask
  before applying it.
- Tests should cover: a new ticket lowering a category, closing and reopening, Rejected, Duplicate, Won't fix and withdrawn
  left out, a withdrawn ticket counting again once reopened, Verified not counting, an untagged ticket, a sub-module rolling up,
  moving a ticket between modules, a module with no tickets, and rounding down (99.6% shows 99%).

### Still to check

1. **Older tickets with no module.** New tickets always have one, but tickets already filed as "Not sure" belong to no
   module card, so they count nowhere until someone sets their module. Check how many exist before building.
