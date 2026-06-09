// scripts/drop-auth-fk.ts
// Elimina el FK de perfiles→auth.users para que prisma db:push funcione sin multi-schema
import { config } from "dotenv"
config({ path: ".env.local", override: true })

import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DIRECT_URL })

async function main() {
  const client = await pool.connect()
  try {
    await client.query(`
      ALTER TABLE public.perfiles
      DROP CONSTRAINT IF EXISTS perfiles_id_fkey;
    `)
    console.log("✓ FK perfiles_id_fkey eliminado")
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
