import { config } from "dotenv"
import { defineConfig } from "prisma/config"

// Next.js convention: .env.local overrides .env
config({ path: ".env.local", override: true })
config({ path: ".env" })

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
    // @ts-expect-error — directUrl ausente en tipos @prisma/config v7.x pero requerido por CLI para pgbouncer
    directUrl: process.env["DIRECT_URL"],
  },
})
