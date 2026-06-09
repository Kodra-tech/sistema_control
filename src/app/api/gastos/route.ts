import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { withCache, invalidateCache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache"
import { gastoSchema } from "@/lib/validations/gasto"
import { checkRateLimit } from "@/lib/ratelimit"

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ── GET /api/gastos ───────────────────────────────────────────────────────────
// Query: mes, anio, categoria, page, pageSize

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const mesParam    = searchParams.get("mes")
  const anioParam   = searchParams.get("anio")
  const categoria   = searchParams.get("categoria")?.trim() ?? ""
  const page        = Math.max(1, parseInt(searchParams.get("page")     ?? "1",  10))
  const pageSize    = Math.min(200, parseInt(searchParams.get("pageSize") ?? "100", 10))

  const ahora = new Date()
  const mes   = mesParam  ? parseInt(mesParam,  10) : ahora.getMonth() + 1
  const anio  = anioParam ? parseInt(anioParam, 10) : ahora.getFullYear()

  const desde = new Date(anio, mes - 1, 1)
  const hasta = new Date(anio, mes,     0)

  const where: Record<string, unknown> = {
    fecha: { gte: desde, lte: hasta },
  }
  if (categoria) where["categoria"] = categoria

  const sinFiltrosExtra = !categoria && page === 1

  const fetcher = async () => {
    const [items, total] = await Promise.all([
      prisma.gasto.findMany({
        where,
        orderBy: [{ categoria: "asc" }, { fecha: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.gasto.count({ where }),
    ])

    const resumen = await prisma.gasto.aggregate({
      where,
      _sum: { monto: true },
    })

    // Subtotales por categoría
    const porCategoria = await prisma.gasto.groupBy({
      by: ["categoria"],
      where,
      _sum: { monto: true },
      orderBy: { _sum: { monto: "desc" } },
    })

    return {
      items,
      total,
      page,
      pageSize,
      resumen: { totalGastos: Number(resumen._sum.monto ?? 0) },
      porCategoria: porCategoria.map((g) => ({
        categoria: g.categoria,
        total:     Number(g._sum.monto ?? 0),
      })),
    }
  }

  const cacheKey = sinFiltrosExtra ? CACHE_KEYS.gastos(mes, anio) : null
  const data     = cacheKey
    ? await withCache(cacheKey, CACHE_TTL.gastos, fetcher)
    : await fetcher()

  return NextResponse.json({ data })
}

// ── POST /api/gastos ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { success: rlOk, headers: rlHeaders } = await checkRateLimit(`gastos:${user.id}`)
  if (!rlOk) return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429, headers: rlHeaders })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })

  const parsed = gastoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const { concepto, monto, categoria, fecha, comprobante, notas } = parsed.data
  const fechaDate = new Date(fecha)

  const gasto = await prisma.gasto.create({
    data: {
      concepto,
      monto,
      categoria,
      fecha:       fechaDate,
      comprobante: comprobante || null,
      notas:       notas ?? null,
    },
  })

  const mes  = fechaDate.getMonth() + 1
  const anio = fechaDate.getFullYear()
  await invalidateCache(CACHE_KEYS.gastos(mes, anio), CACHE_KEYS.kpis(mes, anio))

  return NextResponse.json({ data: gasto }, { status: 201 })
}
