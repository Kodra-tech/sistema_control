import { config } from "dotenv"
import { defineConfig } from "prisma/config"

config({ path: ".env.local", override: true })
config({ path: ".env" })

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // Usar DATABASE_URL (pooling) primero, fallback a DIRECT_URL
    url: process.env["DATABASE_URL"] ?? process.env["DIRECT_URL"],
  },
})