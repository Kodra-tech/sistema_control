import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { withCache, invalidateCache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache"
import { inventarioSchema } from "@/lib/validations/inventario"
import { checkRateLimit } from "@/lib/ratelimit"

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ── GET /api/inventario ───────────────────────────────────────────────────────
// Query: q, categoria, activo, alerta (solo stock bajo), page, pageSize

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const q         = searchParams.get("q")?.trim()         ?? ""
  const categoria = searchParams.get("categoria")?.trim() ?? ""
  const activo    = searchParams.get("activo") !== "false"
  const soloAlerta = searchParams.get("alerta") === "true"
  const page      = Math.max(1, parseInt(searchParams.get("page")     ?? "1",  10))
  const pageSize  = Math.min(200, parseInt(searchParams.get("pageSize") ?? "50", 10))

  const where: Record<string, unknown> = { activo }
  if (q)         where["nombre"]    = { contains: q, mode: "insensitive" as const }
  if (categoria) where["categoria"] = categoria
  if (soloAlerta) {
    // stock_actual <= stock_minimo — filter post-query since Prisma can't compare two column values directly
  }

  const sinFiltros = !q && !categoria && page === 1

  const fetcher = async () => {
    let items = await prisma.inventario.findMany({
      where,
      orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
      skip:    (page - 1) * pageSize,
      take:    pageSize,
    })

    if (soloAlerta) {
      items = items.filter((i) => Number(i.stockActual) <= Number(i.stockMinimo))
    }

    const total = await prisma.inventario.count({ where })
    return { items, total, page, pageSize }
  }

  const cacheKey = sinFiltros && activo && !soloAlerta ? CACHE_KEYS.inventario() : null
  const data     = cacheKey
    ? await withCache(cacheKey, CACHE_TTL.inventario, fetcher)
    : await fetcher()

  return NextResponse.json({ data })
}

// ── POST /api/inventario ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { success: rlOk, headers: rlHeaders } = await checkRateLimit(`inventario:${user.id}`)
  if (!rlOk) return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429, headers: rlHeaders })

  const body   = await req.json().catch(() => null)
  const parsed = inventarioSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const { codigo, nombre, descripcion, categoria, unidad, stockActual, stockMinimo, precioUnitario, precioVenta } = parsed.data

  const item = await prisma.inventario.create({
    data: {
      codigo:         codigo ?? null,
      nombre,
      descripcion:    descripcion ?? null,
      categoria,
      unidad,
      stockActual,
      stockMinimo,
      precioUnitario,
      precioVenta:    precioVenta ?? null,
    },
  })

  await invalidateCache(CACHE_KEYS.inventario(), CACHE_KEYS.inventarioAlertas())
  return NextResponse.json({ data: item }, { status: 201 })
}
