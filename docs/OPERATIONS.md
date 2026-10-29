# Running QA Hub on the office LAN

QA Hub runs on one Windows machine (currently the QA laptop). Everyone else opens it in a browser at that machine's
address. These steps are for whoever runs that machine.

## 1. First-time setup

1. Pull the code and install dependencies: `npm install`.
2. Create or upgrade the database: `npx prisma migrate deploy`, then `npm run db:seed`.
   The seed loads the module list from `data/erp-areas.json`, but only when the module directory is empty.
3. Add these settings to `.env.local`:
   ```
   UPLOAD_DIR=D:\qa-hub\uploads      # ticket screenshots and videos; put it on the 1 TB HDD
   BACKUP_DIR=E:\qa-hub-backups      # ideally a different disk or a network share
   ```
   `UPLOAD_DIR` is required for tickets. Without it, filing a ticket with images shows an error. The folder is created
   on the first upload. Never point it inside the repo or `public/`.
   Videos can be up to 150 MB each, so keep an eye on free space on that drive. A video that was uploaded but never
   sent with a ticket or reply is deleted after 24 hours.
4. Create the first admin. This prints a one-time temporary password:
   ```
   npm run user:create -- --admin --name "Your nickname" --email you@davao-water.gov.ph
   ```
   Sign in, choose your own password, then add everyone else under **Admin → Users**.

## 2. Start the server

```
npm run build
npm run serve          # listens on port 3000 on every network interface
```

- Use `serve` (production mode) for the team. `npm run dev` only listens on this machine.
- `npm run lan:dev` is for testing changes from another device. It needs `LAN_ORIGINS=<this machine's IP>` in `.env.local`.
- To restart after pulling new code: stop the server, then run `npm install`, `npx prisma migrate deploy`, `npm run build` and `npm run serve`.

## 3a. Pilot with a few selected testers first

The safest way to pilot is to combine two controls: only create accounts for the pilot testers, and only open the port
to their PCs.

1. **Try it alone first, with no network changes.** Create a test QA account and a test developer account. Sign in as
   one in a normal browser window and as the other in an InPrivate/Incognito window, or in a second browser. This
   lets you play both sides of a ticket on one laptop.
2. **Then open the port to the pilot PCs only.** Ask each tester for their IP address (`ipconfig` on their PC), then
   run this in an admin PowerShell:
   ```
   New-NetFirewallRule -DisplayName "QA Hub pilot (3000)" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Domain -RemoteAddress 10.100.154.20,10.100.154.31
   ```
   - Replace the example addresses with theirs. Every other PC is still refused.
   - To add someone later: `Set-NetFirewallRule -DisplayName "QA Hub pilot (3000)" -RemoteAddress <full new list>`.
   - To end the pilot: `Remove-NetFirewallRule -DisplayName "QA Hub pilot (3000)"`.
   - Their IPs come from DHCP too, so if a tester suddenly can't connect, check whether their address changed.
3. Don't use tunnelling services such as ngrok, Cloudflare Tunnel or Tailscale Funnel to skip the firewall. They put
   ticket data, including customer details in screenshots, on an outside service.

## 3b. Open it to the whole office (after the pilot)

1. **Windows Firewall:** allow port 3000 on the office network only.
   - DCWD PCs join the `dcwd.gov.ph` domain, so Windows treats the office network as **Domain**, not Private.
   - Run this in an **admin** PowerShell:
     ```
     New-NetFirewallRule -DisplayName "QA Hub (3000)" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Domain
     ```
   - Check the profile first with `Get-NetConnectionProfile`. The rule must match its `NetworkCategory`; never use `-Profile Any`.
   - On domain PCs, IT's Group Policy can override local firewall rules. If other PCs still can't connect, ask IT to allow inbound TCP 3000 to this machine.
2. **A fixed address:** ask IT to reserve this machine's IP address in DHCP, or to give it a DNS name such as
   `qa-hub.dcwd.local`. Otherwise the address changes and people's bookmarks break.
3. Share the address with the team, e.g. `http://192.168.1.25:3000`.
4. **Never** forward the port on the router or expose the app to the internet.

## 4. Backups

```
npm run backup                 # DB snapshot + new uploads → BACKUP_DIR, keeps the last 14 snapshots
```

To run it every night, open **Task Scheduler**, choose **Create Basic Task** and set it to run daily at 12:30 AM. The action is:

- **Program:** `cmd.exe`
- **Arguments:** `/c cd /d "C:\VS Code\quality-ai" && npm run backup >> backup.log 2>&1`

To restore:
1. Stop the server.
2. Copy a snapshot from `BACKUP_DIR\db\` over `prisma\dev.db`.
3. Copy `BACKUP_DIR\uploads\` back to `UPLOAD_DIR`.
4. Start the server again.

## 5. Accounts

- **Office emails only:** every account must use an `@davao-water.gov.ph` address.
- **Can't remember an account's email?** Admin → Users lists every account with its email, role and status.
  Passwords are never stored in readable form, so nobody can look one up: use the key icon to reset it.
- **Sign-up requests:** people can request an account from the sign-in page as a QA tester or developer.
  - Requests wait in **Admin → Users → Waiting for approval**, and the dashboard shows how many are waiting.
  - Approve only people you know are on the team, because approved users can see every ticket.
  - **Approve** shows a one-time temporary password. Give it to the person in person or by office chat, together
    with their email. They choose their own password at first sign-in. If you lose it, use the key icon (Reset password).
  - Reject deletes the request.
  - During the pilot, the firewall rule (section 3a) still limits who can even reach the sign-up page.

- **Forgotten password:** an admin opens Admin → Users → the key icon to reset it. The user gets a new temporary password and is signed out everywhere.
- **Someone leaves:** edit the user and untick *Account is active*. They are signed out at once, and their tickets and comments stay.
- **Failed sign-ins:** after 5 failed sign-ins in 15 minutes, that email is locked out for the rest of the window.
- **Lock-out protection:** at least one active admin must always remain. The app refuses changes that would remove the last one.

## 5a. Daily Accomplishment Reports (My DAR)

- **Set up once (admin):**
  - **Admin → DAR template:** department, unit, default position, the Confirmed by and Noted by signatories, and the core and support duties with their MFOs.
  - Tick **Fill this row's days from my ticket work** on the rows that should get the day entries.
- **Module Codes:** set them in **Team & modules** (e.g. `BCA`, `CRM`, `HR-RSP`, `HR201`). The DAR writes a day as
  "QA - BCA / CRM" from those codes. A sub-module with no code uses its module's code, then its name.
- **Each QA tester:**
  - Opens **My DAR** and adds their full name once under **My details**, since the account only holds a nickname.
  - Picks the period (1–15 or 16 to the end of the month) and checks the days.
  - A day with no ticket work is **REST DAY**. They type over it for work done outside QA Hub, such as HR201 or encoding.
  - Then saves and downloads **Excel** or **PDF**.
- **Privacy:** each tester sees only their own DARs. Admins and developers can't open them.
- **PDF:** made with Playwright's Chromium on this machine. If it says PDF isn't available, run `npx playwright install chromium` once. Excel always works.

## 6. Known limits and next steps

- **Plain HTTP:** passwords and session cookies travel unencrypted on the office network. This is acceptable on a
  trusted LAN for now. The follow-up is HTTPS, using a certificate from IT or a reverse proxy (e.g. Caddy) in front of
  port 3000. Once that's in place, set `COOKIE_SECURE=1` in `.env.local`.
- **One machine:** if the laptop is off or asleep, nobody can reach QA Hub. Turn off sleep while plugged in, or move it
  to an always-on PC later. Moving it means copying the repo, `.env.local`, `prisma\dev.db` and `UPLOAD_DIR`.
- **In-browser screen recording** needs HTTPS. Until then, QA records with **Snipping Tool (Win+Shift+R)** or Xbox Game Bar
  (Win+Alt+R) and uploads the MP4 with **Add video** (MP4 or WebM, up to 3 min / 150 MB). iPhone `.mov` files are refused;
  share them as MP4 ("Most Compatible") instead.
- **Ticket data is sensitive** (customer names, account numbers, amounts) and is never sent to any AI model.
