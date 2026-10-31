# Running QA Hub

QA Hub runs on **Vercel** (the website, with HTTPS) and **Supabase** (the database and the uploaded screenshots and
videos). Both are in Singapore. Nobody's laptop needs to stay on. The QA laptop only runs the nightly backup.

| Where | What is there |
|---|---|
| Supabase project **Quality-ai** (ap-southeast-1) | Postgres database (all tables, RLS on, no policies); Storage bucket `attachments` (private, 50 MB per file, images and videos only) |
| Vercel project (region `sin1`) | The app, built from GitHub; the daily clean-up cron |
| QA laptop | `.env.local`, the nightly backup in **Documents\QA Hub Backups** |

## 1. Settings (environment variables)

The same names go in `.env.local` on a developer's PC and in Vercel → Project → **Settings → Environment Variables**.
`.env.example` lists them without values. Never paste the values in chat, tickets or git.

| Name | Where to find it | Secret? |
|---|---|---|
| `DATABASE_URL` | Supabase → **Connect → ORM** tab, the first line (port 6543, ends `?pgbouncer=true`) | yes, holds the DB password |
| `DIRECT_URL` | Same tab, the second line (port 5432). Used only by migrations | yes |
| `SUPABASE_URL` | Supabase → Project Settings → **Data API** (`https://<ref>.supabase.co`) | no |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → **API Keys** → the `sb_secret_…` key | **yes, full access**; never `NEXT_PUBLIC_` |
| `CRON_SECRET` | Any random text of 32+ characters you make up (e.g. a password manager's generator) | yes |
| `NEXT_PUBLIC_VIDEO_MAX_MB` | Optional. Leave unset on the free plan (50). Raise it only together with the bucket's file size limit | no |
| `BACKUP_DIR` | Optional, laptop only. Default is `Documents\QA Hub Backups` | no |

If the database password or the secret key ever leaks, reset it in Supabase, then update `.env.local` **and** Vercel,
and redeploy.

## 2. Working on the code (developer PC)

1. `npm install`
2. Fill `.env.local` (section 1).
3. `npm run dev` and open http://localhost:3000. This uses the real Supabase project, so test tickets you file are
   real. Delete them afterwards.

**Changing the database** (a new column or table): edit `prisma/schema.prisma`, then
`npx prisma migrate dev --create-only --name <what-changed>`, check the SQL (a new table also needs
`ALTER TABLE "<Name>" ENABLE ROW LEVEL SECURITY;`), and apply it with `npm run db:deploy`. Do this **before** pushing
code that needs the change, so the live site never runs against a database without it.

## 3. Deploying

- Pushing to the `master` branch on GitHub deploys to production automatically. Pushing any other branch makes a
  **preview** deployment with its own URL, using the same database.
- Watch a deploy in Vercel → **Deployments**. If the site breaks after a deploy, open the previous good deployment
  and choose **Promote to Production** (instant rollback); then fix the code.
- Vercel → **Cron Jobs** shows the daily clean-up (`/api/cron/daily`, 02:00 Manila). It deletes uploads nobody sent
  within a day, expired sessions and old sign-in counters. Its daily query also stops the free Supabase project from
  pausing after a week with no use.

### First-time setup of a new Supabase project
Only needed if QA Hub moves to a new project (or after a disaster, see section 4).
1. Create the project in **Southeast Asia (Singapore)**.
2. Storage → **New bucket** `attachments`: private, file size limit 50 MB, allowed types
   `image/png, image/jpeg, image/webp, image/gif, video/mp4, video/webm`.
3. Fill `.env.local` with the new project's values, then `npm run db:deploy` (creates the tables with RLS).
4. Either load a backup (section 4), **or** start empty: `npm run db:seed` (the module list) and create the first admin:
   ```
   npx tsx scripts/create-user.ts --admin --name "Your nickname" --email you@davao-water.gov.ph
   ```
   It prints a one-time temporary password. Run it yourself, in your own terminal.
5. Update the variables in Vercel and redeploy.

## 4. Backups

Supabase's free plan has **no backups**, so the QA laptop makes them:

```
npm run backup
```

It writes to **Documents\QA Hub Backups** (or `BACKUP_DIR`):
- `Database\QA Hub database <date> <time>.json`: every account, ticket, reply, timeline entry, attachment record,
  module, DAR and setting. The last 14 are kept.
- `Files\`: every screenshot and video, in the same `YYYY\MM\` folders as in Storage. Only new files are downloaded.
- `READ ME.txt`: what the folders are.

The backup holds ticket data (customer names, account numbers, amounts). Keep it on the laptop or an office drive;
never upload it anywhere.

**Every night, with Task Scheduler:** open Task Scheduler → **Create Basic Task** → name *QA Hub backup* → **Daily**,
12:30 AM → **Start a program**:
- **Program:** `cmd.exe`
- **Arguments:** `/c cd /d "C:\Users\VYKE\Documents\VS Code Projects\Quality-ai" && npm run backup >> "%USERPROFILE%\Documents\QA Hub Backups\backup.log" 2>&1`

Then open the task's **Properties → Settings** and tick *Run task as soon as possible after a scheduled start is
missed*, so a night with the laptop off is caught up the next morning. Check `backup.log` now and then.

**Restore** (into a new, empty Supabase project only; it refuses a database that has data):
1. Do steps 1–3 of *First-time setup* (section 3), but **not** the seed.
2. Run, with the backup you want:
   ```
   npx tsx scripts/restore.ts --file "C:\Users\VYKE\Documents\QA Hub Backups\Database\QA Hub database 2026-10-31 0030.json"
   ```
   It loads the database in one go (all or nothing), then uploads the files from the `Files` folder next to it.
3. Update Vercel's variables, redeploy. Everyone signs in again; passwords are unchanged.

## 5. Accounts

- **Office emails only:** every account must use an `@davao-water.gov.ph` address.
- **Can't remember an account's email?** Admin → Users lists every account with its email, role and status.
  Passwords are never stored in readable form, so nobody can look one up: use the key icon to reset it.
- **Sign-up requests:** people can request an account from the sign-in page as a QA tester or developer. The sign-in
  page is on the internet now, so the admin approval is the gate. Signing up with an email that already has an account
  (or a request waiting) says so on the form.
  - Requests wait in **Admin → Users → Waiting for approval**, and the dashboard shows how many are waiting.
  - Approve only people you know are on the team, because approved users can see every ticket.
  - **Approve** shows a one-time temporary password. Give it to the person in person or by office chat, together
    with their email. They choose their own password at first sign-in. If you lose it, use the key icon (Reset password).
  - Reject deletes the request. At most 20 sign-up requests per hour are accepted.
- **Forgotten password:** the person clicks **Forgot your password?** on the sign-in page and enters their email.
  No email is sent: the request appears in **Admin → Users → Password reset requests** (the dashboard and the sidebar's
  Users count show it too). Check it's really them, click **Reset password**, and give them the temporary password in
  person. **Dismiss** removes a request without resetting. You can also reset anyone any time with the key icon. A reset
  signs them out everywhere. At most 5 requests per email and 30 in total are accepted per hour.
- **The only admin is locked out:** on a PC with `.env.local`, run
  `npx tsx scripts/reset-password.ts --email you@davao-water.gov.ph`. It prints a temporary password once.
- **Someone leaves:** edit the user and untick *Account is active*. They are signed out at once, and their tickets and
  comments stay.
- **Failed sign-ins:** after 5 failed sign-ins in 15 minutes, that email is locked out for the rest of the window.
- **Lock-out protection:** at least one active admin must always remain. The app refuses changes that would remove the last one.

## 5b. Notifications

- The **bell** in the top bar shows how many tickets have something new for you, and the newest ones. The sidebar shows
  the same number on **Tickets**, and new tickets have a red dot in the lists.
- "New" means anything someone **else** did on a ticket you can see (developers: tickets assigned to them; QA: their
  own; admins: all): a new ticket, a reply, a status change, a reassignment or an edit. Your own actions never notify you.
- Opening a ticket marks it read. **Mark all as read** in the bell clears everything.
- The app checks every 30 seconds while the tab is open, and lists and tickets update by themselves; no reload needed.
  Nothing is checked while the tab is in the background, and it checks at once when you come back.

## 6. Daily Accomplishment Reports (My DAR)

- **Set up once (admin):**
  - **Admin → DAR template:** department, unit, default position, the Confirmed by and Noted by signatories, and the
    core and support duties with their MFOs.
  - Tick **Fill this row's days from my ticket work** on the rows that should get the day entries.
- **Module codes:** set them in **Team & modules** (e.g. `BCA`, `CRM`, `HR-RSP`, `HR201`). The DAR writes a day as
  "QA - BCA / CRM" from those codes. A sub-module with no code uses its module's code, then its name.
- **Admins** have their own **My DAR** too (in the sidebar under Tickets). **DAR template** on My DAR and **My
  DAR** on the template page switch between the two. An admin still can't open anyone else's DAR.
- **Each QA tester:**
  - Opens **My DAR** and adds their full name once under **My details**, since the account only holds a nickname.
  - Picks the period (1–15 or 16 to the end of the month) and checks the days.
  - A day with no ticket work is **REST DAY**. They type over it for work done outside QA Hub, such as HR201 or encoding.
  - Then saves and either downloads **Excel** or uses **Print** (choose *Save as PDF* in the print dialog for a PDF).
- **Privacy:** each person sees only their own DARs. Admins and developers can't open a tester's.

## 7. Free-plan limits and when to upgrade

| Limit (free) | What happens | Upgrade |
|---|---|---|
| Storage 1 GB | Uploads start failing. At 50 MB a video, about 20 long videos fill it | Supabase Pro |
| 50 MB per file | Longer or sharper videos are refused before upload | Pro, then raise the bucket limit and `NEXT_PUBLIC_VIDEO_MAX_MB` |
| Egress (downloads) 5 GB / month | Watching videos uses it up; Supabase warns by email | Pro |
| Database 500 MB | Text only, so this lasts a long time | Pro |
| No Supabase backups | The laptop's nightly backup is the only copy | Pro adds daily backups |
| Vercel Hobby is for non-commercial use | Ask IT whether this counts; otherwise Vercel Pro | Vercel Pro |
| One cron run per day | Fine for the clean-up | — |

Check usage in Supabase → **Organization → Usage** about once a month.

## 8. Good to know

- **Videos:** QA records with **Snipping Tool (Win+Shift+R)** or Xbox Game Bar (Win+Alt+R) and uploads the MP4 with
  **Add video** (MP4 or WebM, up to 3 min / 50 MB). iPhone `.mov` files are refused; share them as MP4 ("Most
  Compatible") instead.
- **Ticket data is sensitive** (customer names, account numbers, amounts) and is never sent to any AI model.
- **Supabase's own API** (the publishable key) can't read anything: every table has RLS on with no policies, and the
  bucket is private. Only QA Hub's server, with the secret key, reaches the data.
