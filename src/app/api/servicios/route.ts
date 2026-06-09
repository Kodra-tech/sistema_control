import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { withCache, invalidateCache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache"
import { servicioSchema } from "@/lib/validations/servicios"
import { checkRateLimit } from "@/lib/ratelimit"

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ── GET /api/servicios ────────────────────────────────────────────────────────
// Query: activo (default true) | q (nombre/categoría) | categoria | page | pageSize

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const activo    = searchParams.get("activo") !== "false"
  const q         = searchParams.get("q")?.trim() ?? ""
  const categoria = searchParams.get("categoria")?.trim() ?? ""
  const page      = Math.max(1, parseInt(searchParams.get("page")      ?? "1",  10))
  const pageSize  = Math.min(200, parseInt(searchParams.get("pageSize") ?? "50", 10))

  const where = {
    activo,
    ...(q ? {
      OR: [
        { nombre:    { contains: q, mode: "insensitive" as const } },
        { categoria: { contains: q, mode: "insensitive" as const } },
      ],
    } : {}),
    ...(categoria ? { categoria: { equals: categoria, mode: "insensitive" as const } } : {}),
  }

  const fetcher = async () => {
    const [items, total] = await Promise.all([
      prisma.servicio.findMany({
        where,
        orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.servicio.count({ where }),
    ])
    return { items, total, page, pageSize }
  }

  // Cachear solo la lista simple (sin filtros, página 1) TTL 5 min
  const cacheKey = !q && !categoria && page === 1 ? CACHE_KEYS.servicios() : null
  const data = cacheKey
    ? await withCache(cacheKey, CACHE_TTL.servicios, fetcher)
    : await fetcher()

  return NextResponse.json({ data })
}

// ── POST /api/servicios ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { success: rlOk, headers: rlHeaders } = await checkRateLimit(`servicios:${user.id}`)
  if (!rlOk) return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429, headers: rlHeaders })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })

  const parsed = servicioSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const { nombre, descripcion, precio, costo, duracion_minutos, categoria, activo } = parsed.data

  const servicio = await prisma.servicio.create({
    data: {
      nombre,
      descripcion:     descripcion   ?? null,
      precio,
      costo:           costo         ?? null,
      duracionMinutos: duracion_minutos,
      categoria:       categoria     ?? null,
      activo,
    },
  })

  await invalidateCache(CACHE_KEYS.servicios())
  return NextResponse.json({ data: servicio }, { status: 201 })
}
