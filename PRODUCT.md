# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

QA testers (5) and the developers of the DCWD ERP, served equally: when a choice helps one side and hurts the other,
find one that works for both. Testers file ERP bugs, suggestions and improvements, check fixes and write their Daily
Accomplishment Report. Developers read tickets, discuss them and resolve them. Admins approve accounts and manage users,
modules and the workspace.

Accounts are for `@davao-water.gov.ph` emails only, and each sign-up waits for an admin's approval.

## Product Purpose

QA Hub is the ticket hub for the DCWD ERP. It replaces Messenger for reporting and discussing ERP issues: each ticket
holds its marked-up screenshots, videos and conversation, and a who's-who directory shows who owns each module.

Success means every part works as intended: tickets, conversations and modules all behave correctly and reliably.

## Positioning

QA Hub is built for one team and one system. Its tickets, roles, module owners and DAR follow how DCWD's QA testers and
ERP developers actually work, and ticket evidence that shows customer data stays behind its login and private storage.

## Operating Context

- Testers find an issue in the ERP, capture it, mark it up and file it in QA Hub, then the conversation stays on that
  ticket until the fix is checked.
- QA Hub runs in the browser on laptops and phones, and it can be installed as an app with push notifications. On
  Android, a screenshot or recording can be shared straight into a new ticket.
- QA testers also make their Daily Accomplishment Report here, in 15-day periods, and export it.
- ERP terms (BAM, MCR, JMS, NSC, OR and others) are defined in `docs/glossary.md`.

## Capabilities and Constraints

- **Current areas:** home, tickets, new ticket with screenshot markup, ticket conversation, my inbox, team directory,
  My DAR, my account, settings and admin users.
- **Roles:** Admin, QA tester and Developer, in the one matrix at `lib/auth/permissions.ts`. Filing a ticket is for QA
  testers and admins, and resolving one is for developers and admins. Each person sees only the tickets in their scope.
- **Ticket data never goes to an LLM.** Ticket text, screenshots and videos can show customer names, account numbers
  and amounts. No AI feature reads tickets unless a local-only design is approved first.
- **Everything is behind login.** Files stay in private storage and are served only after a session and scope check.
- **Free-tier limits apply for now:** 50 MB per file, 1 GB of Storage and 500 MB of database.
- **No offline mode:** the installed app keeps no copy of pages or tickets.
- **Undecided:** whether laptop or phone comes first when the two compete. Both are supported today.

## Brand Commitments

- **Identity:** the DCWD seal (`public/dcwd-seal.png`) and the names DCWD and QA Hub.
- **Voice:** formal government tone.
- **Approach:** minimal, with functionality first.

## Evidence on Hand

- **Assets:** the seal, the app icons in `public/icons/` and the notification tones in `public/sounds/`.
- **Records:** `docs/CHANGELOG.md`, `docs/OPERATIONS.md`, `docs/PLAN.md` and `docs/glossary.md`.
- **Not available:** usage figures, testimonials and performance results. Do not invent them.
- **Sample content:** real tickets can hold customer data, so mock-ups and demos use made-up names, account numbers and
  amounts.

## Product Principles

1. **Function comes first.** A feature that works as intended matters more than anything added around it. Add nothing
   that does not help someone do their work.
2. **Serve both sides of a ticket.** A ticket has to be clear to the tester who files it and the developer who fixes it.
3. **Keep the whole story on the ticket.** Evidence, discussion and status stay together, so nobody has to go back to
   Messenger.
4. **Protect customer data by default.** Privacy limits hold even when they make a feature harder to build.
5. **Sound like the institution.** Wording stays formal and fits a government water district.
