import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { withCache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache"

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

const MESES_CORTOS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

// ── GET /api/reportes/anual?anio= ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const anio = parseInt(searchParams.get("anio") ?? String(new Date().getFullYear()), 10)

  const fetcher = async () => {
    const desde = new Date(anio,  0, 1)
    const hasta = new Date(anio, 11, 31)

    const [ventasPorMes, gastosPorMes, ventasAll] = await Promise.all([
      prisma.venta.groupBy({
        by:      ["fecha"],
        where:   { fecha: { gte: desde, lte: hasta } },
        _sum:    { total: true },
      }),
      prisma.gasto.groupBy({
        by:    ["fecha"],
        where: { fecha: { gte: desde, lte: hasta } },
        _sum:  { monto: true },
      }),
      prisma.venta.findMany({
        where:  { fecha: { gte: desde, lte: hasta } },
        select: { fecha: true, precioUnitario: true, costoUnitario: true, cantidad: true },
      }),
    ])

    // Agrupar por mes
    const ventasMapa: Record<number, number> = {}
    ventasPorMes.forEach((v) => {
      const m = new Date(v.fecha).getMonth()
      ventasMapa[m] = (ventasMapa[m] ?? 0) + Number(v._sum.total ?? 0)
    })

    const gastosMapa: Record<number, number> = {}
    gastosPorMes.forEach((g) => {
      const m = new Date(g.fecha).getMonth()
      gastosMapa[m] = (gastosMapa[m] ?? 0) + Number(g._sum.monto ?? 0)
    })

    const utilidadMapa: Record<number, number> = {}
    ventasAll.forEach((v) => {
      const m = new Date(v.fecha).getMonth()
      const u = v.precioUnitario && v.costoUnitario
        ? (Number(v.precioUnitario) - Number(v.costoUnitario)) * v.cantidad
        : 0
      utilidadMapa[m] = (utilidadMapa[m] ?? 0) + u
    })

    const meses = Array.from({ length: 12 }, (_, i) => {
      const ventas        = ventasMapa[i]   ?? 0
      const gastos        = gastosMapa[i]   ?? 0
      const utilidadBruta = utilidadMapa[i] ?? 0
      const utilidadNeta  = utilidadBruta - gastos
      return {
        mes:            i + 1,
        mes_label:      MESES_CORTOS[i],
        ventas_totales: ventas,
        gastos_totales: gastos,
        utilidad_bruta: utilidadBruta,
        utilidad_neta:  utilidadNeta,
      }
    })

    return { anio, meses }
  }

  const data = await withCache(CACHE_KEYS.reporteAnual(anio), CACHE_TTL.reportes, fetcher)
  return NextResponse.json({ data })
}
