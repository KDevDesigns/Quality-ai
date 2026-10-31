# QA Hub

The DCWD QA team's ticket hub for the in-house ERP: bugs, suggestions and improvements with screenshots, videos and a
conversation per ticket, a who's-who of module owners, and each QA tester's Daily Accomplishment Report.

Runs on Vercel + Supabase behind QA Hub's own login.

- Setup, deploys, backups and accounts: [docs/OPERATIONS.md](docs/OPERATIONS.md)
- Rules for working on the code: [CLAUDE.md](CLAUDE.md)
- Roadmap: [docs/PLAN.md](docs/PLAN.md) · history: [docs/CHANGELOG.md](docs/CHANGELOG.md)

```
npm install
cp .env.example .env.local   # then fill it in
npm run dev                  # http://localhost:3000
```
