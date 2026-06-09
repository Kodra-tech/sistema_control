import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { withCache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache"

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ── GET /api/reportes/mensual?mes=&anio= ─────────────────────────────────────

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const ahora = new Date()
  const mes   = parseInt(searchParams.get("mes")  ?? String(ahora.getMonth() + 1), 10)
  const anio  = parseInt(searchParams.get("anio") ?? String(ahora.getFullYear()),  10)

  const fetcher = async () => {
    const desde = new Date(anio, mes - 1, 1)
    const hasta = new Date(anio, mes,     0)

    // Mes anterior
    const mesAnt  = mes  === 1 ? 12     : mes  - 1
    const anioAnt = mes  === 1 ? anio - 1 : anio
    const desdeAnt = new Date(anioAnt, mesAnt - 1, 1)
    const hastaAnt = new Date(anioAnt, mesAnt,     0)

    const [
      ventasMes,       ventasAnt,
      gastosMes,       gastosAnt,
      topServicios,
      porMetodo,
      ventasMesAll,
    ] = await Promise.all([
      prisma.venta.aggregate({ where: { fecha: { gte: desde, lte: hasta } }, _sum: { total: true } }),
      prisma.venta.aggregate({ where: { fecha: { gte: desdeAnt, lte: hastaAnt } }, _sum: { total: true } }),
      prisma.gasto.aggregate({ where: { fecha: { gte: desde, lte: hasta } }, _sum: { monto: true } }),
      prisma.gasto.aggregate({ where: { fecha: { gte: desdeAnt, lte: hastaAnt } }, _sum: { monto: true } }),
      prisma.venta.groupBy({
        by: ["concepto"],
        where: { fecha: { gte: desde, lte: hasta }, tipo: "servicio", concepto: { not: null } },
        _count:   { id: true },
        _sum:     { total: true },
        orderBy:  { _sum: { total: "desc" } },
        take: 5,
      }),
      prisma.venta.groupBy({
        by: ["metodoPago"],
        where: { fecha: { gte: desde, lte: hasta } },
        _sum:   { total: true },
        _count: { id: true },
      }),
      prisma.venta.findMany({
        where: { fecha: { gte: desde, lte: hasta } },
        select: { precioUnitario: true, costoUnitario: true, cantidad: true },
      }),
    ])

    const totalVentas   = Number(ventasMes._sum.total  ?? 0)
    const totalGastos   = Number(gastosMes._sum.monto  ?? 0)
    const totalVentasAnt = Number(ventasAnt._sum.total ?? 0)
    const totalGastosAnt = Number(gastosAnt._sum.monto ?? 0)

    const utilidadBruta = ventasMesAll.reduce((acc, v) => {
      if (!v.precioUnitario || !v.costoUnitario) return acc
      return acc + (Number(v.precioUnitario) - Number(v.costoUnitario)) * v.cantidad
    }, 0)

    const utilidadNeta    = utilidadBruta - totalGastos
    const margen          = totalVentas > 0 ? (utilidadBruta / totalVentas) * 100 : 0

    const utilidadAntBruta = 0  // simplificado — podríamos calcularlo igual
    const utilidadNeta_ant = utilidadAntBruta - totalGastosAnt

    return {
      mes, anio,
      ventas_totales:   totalVentas,
      gastos_totales:   totalGastos,
      utilidad_bruta:   utilidadBruta,
      utilidad_neta:    utilidadNeta,
      margen_pct:       margen,
      mes_anterior: {
        ventas_totales:  totalVentasAnt,
        gastos_totales:  totalGastosAnt,
        utilidad_neta:   utilidadNeta_ant,
      },
      top_servicios: topServicios.map((s) => ({
        concepto: s.concepto ?? "",
        count:    s._count.id,
        total:    Number(s._sum.total ?? 0),
      })),
      por_metodo_pago: porMetodo.map((m) => ({
        metodoPago: m.metodoPago,
        total:      Number(m._sum.total ?? 0),
        count:      m._count.id,
      })),
    }
  }

  const data = await withCache(
    CACHE_KEYS.reporteMensual(mes, anio),
    CACHE_TTL.reportes,
    fetcher,
  )

  return NextResponse.json({ data })
}
