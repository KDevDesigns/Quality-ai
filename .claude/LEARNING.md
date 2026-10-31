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
## Mistakes caught (don't repeat)
- Hard-coded colours (`#eef2fd`, `bg-white`) ignore dark mode → use theme tokens / CSS variables
- (none yet) Warned: service_role key must never be NEXT_PUBLIC_ or pasted in chat
- Warned: don't run `npx prisma init` or copy dashboard schema snippets — they overwrite our Prisma 7 setup
## Next to learn
- Signed URLs for private Storage files
