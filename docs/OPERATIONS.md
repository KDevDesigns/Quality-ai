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
4. Create the first admin. This prints a one-time temporary password:
   ```
   npm run user:create -- --admin --name "Your Name" --email you@davao-water.gov.ph
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

- **Forgotten password:** an admin opens Admin → Users → the key icon to reset it. The user gets a new temporary password and is signed out everywhere.
- **Someone leaves:** edit the user and untick *Account is active*. They are signed out at once, and their tickets and comments stay.
- **Failed sign-ins:** after 5 failed sign-ins in 15 minutes, that email is locked out for the rest of the window.
- **Lock-out protection:** at least one active admin must always remain. The app refuses changes that would remove the last one.

## 6. Known limits and next steps

- **Plain HTTP:** passwords and session cookies travel unencrypted on the office network. This is acceptable on a
  trusted LAN for now. The follow-up is HTTPS, using a certificate from IT or a reverse proxy (e.g. Caddy) in front of
  port 3000. Once that's in place, set `COOKIE_SECURE=1` in `.env.local`.
- **One machine:** if the laptop is off or asleep, nobody can reach QA Hub. Turn off sleep while plugged in, or move it
  to an always-on PC later. Moving it means copying the repo, `.env.local`, `prisma\dev.db` and `UPLOAD_DIR`.
- **In-browser screen recording** needs HTTPS. Until then, QA records with **Snipping Tool (Win+Shift+R)** and uploads the MP4.
- **Ticket data is sensitive** (customer names, account numbers, amounts) and is never sent to any AI model.
