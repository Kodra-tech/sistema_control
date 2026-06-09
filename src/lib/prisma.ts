import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@/generated/prisma/client"

// Runtime usa DATABASE_URL (pooler pgbouncer, puerto 6543) — alcanzable desde Vercel y serverless.
// DIRECT_URL (puerto 5432) solo es necesario para migraciones locales (prisma.config.ts).
const connectionString = process.env.DATABASE_URL ?? ""

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient
  pool: Pool
}

// max:2 evita agotar conexiones en serverless (cada función crea su propio pool)
const pool = globalForPrisma.pool ?? new Pool({ connectionString, max: 2 })
const adapter = new PrismaPg(pool)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pool = pool
  globalForPrisma.prisma = prisma
}
