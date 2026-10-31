# Learning Log
## Understood
- Connection string + pooler — filled both URLs correctly (6543 app, 5432 migrations, real password, no brackets)
## Still shaky
- Environment variables / .env.local — introduced 2026-10-30 while setting up Supabase; not yet used alone
- RLS with no policies = deny the public API; QA Hub connects as table owner — introduced 2026-10-30
- Migration — introduced 2026-10-30 (renovation plan analogy)
- Cron job + CRON_SECRET — introduced 2026-10-30
- ORM (Prisma) — introduced 2026-10-30; Supabase's Connect → ORM tab gives both URLs
- Publishable key (public by design) vs secret key (server only) — check question pending
- React context — introduced 2026-10-31 with the ticket image gallery (shared bulletin board analogy)
- CSS variables for themes (light value + `.dark` value) — introduced 2026-10-31 fixing the login brand pane
- Hydration (server HTML must match the first browser render) — introduced 2026-10-31 fixing the sidebar mismatch
- Polling (the browser asks the server "anything new?" every 30 s) — introduced 2026-10-31 with the notification bell
- Additive migration first, code second (so the live site never misses a column) — introduced 2026-10-31
- Vercel env vars: read only at build time → must redeploy after saving; integration-added vars are locked until the store is disconnected — introduced 2026-10-31 (sticky-note analogy); check question pending
- Web Push: service worker = mailbox that stays after the tab closes; subscription = its address; push service = post office — introduced 2026-10-31 (Phase 3.8c); check question pending (iPhone needs Add to Home Screen)
- VAPID keys: public/private pair proving pushes come from QA Hub; private one is a secret — introduced 2026-10-31
- SSRF: never let a user-given URL make the server call anywhere → allow-list hosts — introduced 2026-10-31
- Browsers show the notification permission question only after a user click (anti-spam); ad blockers can silently hide it — learned 2026-10-31 while debugging
- Autoplay rule: a page can play sound only after the person clicked in it; a service worker can't play sound at all — introduced 2026-10-31 (tones); check question pending
- Magic bytes: a file's real type comes from its first bytes, not its name (reused for MP3/WAV tones) — introduced 2026-10-31
- Signed URL: a private file link that expires (10 min for notification photos) — used 2026-10-31; was in "Next to learn"
- Privacy trade-off: showing data vs. who can see the screen → per-user switch + OS lock-screen settings — decided 2026-10-31
- `after()`: run slow side work after the response, so the user's action stays fast — introduced 2026-10-31
## Mistakes caught (don't repeat)
- Hard-coded colours (`#eef2fd`, `bg-white`) ignore dark mode → use theme tokens / CSS variables
- (none yet) Warned: service_role key must never be NEXT_PUBLIC_ or pasted in chat
- Live DATABASE_URL pointed at a Vercel Prisma Postgres store, not Supabase → sign-in failed (2026-10-31)
- Warned: don't run `npx prisma init` or copy dashboard schema snippets — they overwrite our Prisma 7 setup
## Next to learn
- Signed URLs for private Storage files
