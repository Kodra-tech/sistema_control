import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { withCache, invalidateCache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache"
import { ventaSchema } from "@/lib/validations/venta"
import { checkRateLimit } from "@/lib/ratelimit"

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ── GET /api/ventas ───────────────────────────────────────────────────────────
// Query: mes, anio, tipo, cliente_id, metodo_pago, page, pageSize

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const mesParam      = searchParams.get("mes")
  const anioParam     = searchParams.get("anio")
  const tipo          = searchParams.get("tipo")?.trim() ?? ""
  const clienteId     = searchParams.get("cliente_id")?.trim() ?? ""
  const metodoPago    = searchParams.get("metodo_pago")?.trim() ?? ""
  const page          = Math.max(1, parseInt(searchParams.get("page")     ?? "1",  10))
  const pageSize      = Math.min(200, parseInt(searchParams.get("pageSize") ?? "50", 10))

  const ahora  = new Date()
  const mes    = mesParam  ? parseInt(mesParam,  10) : ahora.getMonth() + 1
  const anio   = anioParam ? parseInt(anioParam, 10) : ahora.getFullYear()

  const desde  = new Date(anio, mes - 1, 1)
  const hasta  = new Date(anio, mes,     0)  // último día del mes

  const where: Record<string, unknown> = {
    fecha: { gte: desde, lte: hasta },
  }
  if (tipo)        where["tipo"]       = tipo
  if (clienteId)   where["clienteId"]  = clienteId
  if (metodoPago)  where["metodoPago"] = metodoPago

  const sinFiltrosExtra = !tipo && !clienteId && !metodoPago && page === 1

  const fetcher = async () => {
    const [items, total] = await Promise.all([
      prisma.venta.findMany({
        where,
        orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          cliente: { select: { id: true, nombre: true, apellido: true } },
        },
      }),
      prisma.venta.count({ where }),
    ])

    // Calcular totales del período
    const resumen = await prisma.venta.aggregate({
      where,
      _sum: { total: true, subtotal: true },
    })

    // Utilidad = Σ (precioUnitario - costoUnitario) * cantidad
    const ventasConCosto = await prisma.venta.findMany({
      where,
      select: { precioUnitario: true, costoUnitario: true, cantidad: true },
    })
    const utilidadTotal = ventasConCosto.reduce((acc, v) => {
      const u = v.precioUnitario && v.costoUnitario
        ? (Number(v.precioUnitario) - Number(v.costoUnitario)) * v.cantidad
        : 0
      return acc + u
    }, 0)

    return {
      items,
      total,
      page,
      pageSize,
      resumen: {
        ventas:   Number(resumen._sum.total   ?? 0),
        subtotal: Number(resumen._sum.subtotal ?? 0),
        utilidad: utilidadTotal,
      },
    }
  }

  const cacheKey = sinFiltrosExtra ? CACHE_KEYS.ventas(mes, anio) : null
  const data     = cacheKey
    ? await withCache(cacheKey, CACHE_TTL.ventas, fetcher)
    : await fetcher()

  return NextResponse.json({ data })
}

// ── POST /api/ventas ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { success: rlOk, headers: rlHeaders } = await checkRateLimit(`ventas:${user.id}`)
  if (!rlOk) return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429, headers: rlHeaders })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })

  const parsed = ventaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const {
    clienteId, citaId, inventarioId, tipo, concepto,
    cantidad, precioUnitario, costoUnitario, descuento = 0,
    metodoPago, fecha, notas,
  } = parsed.data

  const subtotal = precioUnitario * cantidad
  const total    = Math.max(0, subtotal - descuento)
  const fechaDate = new Date(fecha)

  let venta
  try {
    venta = await prisma.$transaction(async (tx) => {
      // Si es producto: verificar y descontar stock atómicamente
      if (tipo === "producto" && inventarioId) {
        const inv = await tx.inventario.findUnique({ where: { id: inventarioId } })
        if (!inv) throw new Error("Producto no encontrado")
        if (Number(inv.stockActual) < cantidad) {
          throw new Error(`Stock insuficiente. Disponible: ${inv.stockActual}`)
        }
        await tx.inventario.update({
          where: { id: inventarioId },
          data:  { stockActual: { decrement: cantidad } },
        })
      }

      return tx.venta.create({
        data: {
          clienteId:     clienteId ?? "",
          citaId:        citaId        ?? null,
          inventarioId:  inventarioId  ?? null,
          tipo,
          concepto,
          cantidad,
          precioUnitario,
          costoUnitario: costoUnitario ?? null,
          subtotal,
          descuento,
          total,
          metodoPago,
          fecha: fechaDate,
          notas: notas ?? null,
        },
        include: { cliente: { select: { id: true, nombre: true, apellido: true } } },
      })
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al crear la venta"
    return NextResponse.json({ error: msg }, { status: 422 })
  }

  const mes  = fechaDate.getMonth() + 1
  const anio = fechaDate.getFullYear()
  await invalidateCache(
    CACHE_KEYS.ventas(mes, anio),
    CACHE_KEYS.kpis(mes, anio),
  )

  return NextResponse.json({ data: venta }, { status: 201 })
}
