import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { withCache, invalidateCache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache"
import { clienteSchema } from "@/lib/validations/clientes"
import { checkRateLimit } from "@/lib/ratelimit"

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ── GET /api/clientes ─────────────────────────────────────────────────────────
// Query params: activo (default true) | q (search nombre) | page | pageSize

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const activo    = searchParams.get("activo") !== "false"      // default true
  const q         = searchParams.get("q")?.trim() ?? ""
  const page      = Math.max(1, parseInt(searchParams.get("page")     ?? "1",  10))
  const pageSize  = Math.min(100, parseInt(searchParams.get("pageSize") ?? "20", 10))
  const skip      = (page - 1) * pageSize

  const where = {
    activo,
    ...(q ? { nombre: { contains: q, mode: "insensitive" as const } } : {}),
  }

  const fetcher = async () => {
    const [items, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        orderBy: { nombre: "asc" },
        skip,
        take: pageSize,
      }),
      prisma.cliente.count({ where }),
    ])
    return { items, total, page, pageSize }
  }

  // Solo cachear primera página sin búsqueda
  const cacheKey = !q && page === 1 ? CACHE_KEYS.clientes(activo) : null
  const data = cacheKey
    ? await withCache(cacheKey, CACHE_TTL.clientes, fetcher)
    : await fetcher()

  return NextResponse.json({ data })
}

// ── POST /api/clientes ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { success: rlOk, headers: rlHeaders } = await checkRateLimit(`clientes:${user.id}`)
  if (!rlOk) return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429, headers: rlHeaders })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })

  const parsed = clienteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const { nombre, telefono, email, notas } = parsed.data

  const cliente = await prisma.cliente.create({
    data: {
      nombre,
      telefono: telefono ?? null,
      email:    email    || null,
      notas:    notas    ?? null,
    },
  })

  await invalidateCache(CACHE_KEYS.clientes(true), CACHE_KEYS.clientes(false))

  return NextResponse.json({ data: cliente }, { status: 201 })
}
