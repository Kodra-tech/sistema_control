import { config } from "dotenv"
import { defineConfig } from "prisma/config"

// Next.js convention: .env.local overrides .env
config({ path: ".env.local", override: true })
config({ path: ".env" })

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // Usar DIRECT_URL (puerto 5432) para operaciones de schema (push/migrate)
    // El runtime usa DATABASE_URL (pooler) via pg Pool en src/lib/prisma.ts
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
})
