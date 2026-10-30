import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a direct (session) connection; the transaction pooler in DATABASE_URL can't run them.
    // Optional so `prisma generate` (postinstall) works without database settings.
    url: process.env.DIRECT_URL,
  },
});
