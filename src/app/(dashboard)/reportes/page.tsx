import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { MonthSelector } from "@/components/shared/MonthSelector"
import { KPICard } from "@/components/dashboard/KPICard"
import { ReportesTablas } from "@/components/reportes/ReportesTablas"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMXN } from "@/lib/utils/currency"

interface PageProps {
  searchParams: Promise<{ mes?: string; anio?: string }>
}

export default function ReportesPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<ReportesSkeleton />}>
      <ReportesContent searchParams={searchParams} />
    </Suspense>
  )
}

async function ReportesContent({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const params = await searchParams
  const ahora  = new Date()
  const mes    = parseInt(params.mes  ?? String(ahora.getMonth() + 1), 10)
  const anio   = parseInt(params.anio ?? String(ahora.getFullYear()),  10)

  const desde   = new Date(anio, mes - 1, 1)
  const hasta   = new Date(anio, mes,     0)
  const mesAnt  = mes  === 1 ? 12     : mes - 1
  const anioAnt = mes  === 1 ? anio - 1 : anio
  const desdeAnt = new Date(anioAnt, mesAnt - 1, 1)
  const hastaAnt = new Date(anioAnt, mesAnt,     0)

  // Semanas del mes
  const semanas = [
    { label: "Sem. 1", gte: new Date(anio, mes - 1, 1),  lte: new Date(anio, mes - 1, 7)  },
    { label: "Sem. 2", gte: new Date(anio, mes - 1, 8),  lte: new Date(anio, mes - 1, 14) },
    { label: "Sem. 3", gte: new Date(anio, mes - 1, 15), lte: new Date(anio, mes - 1, 21) },
    { label: "Sem. 4", gte: new Date(anio, mes - 1, 22), lte: hasta                       },
  ]

  // Todos los datos en paralelo
  const [
    ventasMes, gastosMes, ventasAnt, gastosAnt,
    porTipo, porMetodo,
    semanaVentas, semanaGastos,
    mesesAnio, ventasAll,
  ] = await Promise.all([
    prisma.venta.aggregate({ where: { fecha: { gte: desde, lte: hasta } }, _sum: { total: true } }),
    prisma.gasto.aggregate({ where: { fecha: { gte: desde, lte: hasta } }, _sum: { monto: true } }),
    prisma.venta.aggregate({ where: { fecha: { gte: desdeAnt, lte: hastaAnt } }, _sum: { total: true } }),
    prisma.gasto.aggregate({ where: { fecha: { gte: desdeAnt, lte: hastaAnt } }, _sum: { monto: true } }),
    // Desglose por tipo
    prisma.venta.groupBy({
      by: ["tipo"],
      where: { fecha: { gte: desde, lte: hasta } },
      _sum: { total: true }, _count: { id: true },
    }),
    // Desglose por método de pago
    prisma.venta.groupBy({
      by: ["metodoPago"],
      where: { fecha: { gte: desde, lte: hasta } },
      _sum: { total: true }, _count: { id: true },
    }),
    // Ventas por semana
    Promise.all(semanas.map((s) =>
      prisma.venta.aggregate({ where: { fecha: { gte: s.gte, lte: s.lte } }, _sum: { total: true } }),
    )),
    // Gastos por semana
    Promise.all(semanas.map((s) =>
      prisma.gasto.aggregate({ where: { fecha: { gte: s.gte, lte: s.lte } }, _sum: { monto: true } }),
    )),
    // 12 meses del año para comparativa
    Promise.all(Array.from({ length: 12 }, (_, i) => {
      const d = new Date(anio, i, 1)
      const h = new Date(anio, i + 1, 0)
      return Promise.all([
        prisma.venta.aggregate({ where: { fecha: { gte: d, lte: h } }, _sum: { total: true } }),
        prisma.gasto.aggregate({ where: { fecha: { gte: d, lte: h } }, _sum: { monto: true } }),
      ])
    })),
    // Para calcular utilidad del mes
    prisma.venta.findMany({
      where: { fecha: { gte: desde, lte: hasta } },
      select: { precioUnitario: true, costoUnitario: true, cantidad: true },
    }),
  ])

  const totalVentas    = Number(ventasMes._sum.total  ?? 0)
  const totalGastos    = Number(gastosMes._sum.monto  ?? 0)
  const totalVentasAnt = Number(ventasAnt._sum.total  ?? 0)
  const totalGastosAnt = Number(gastosAnt._sum.monto  ?? 0)

  const utilidadBruta  = ventasAll.reduce((acc, v) => {
    if (!v.precioUnitario || !v.costoUnitario) return acc
    return acc + (Number(v.precioUnitario) - Number(v.costoUnitario)) * v.cantidad
  }, 0)
  const utilidadNeta   = utilidadBruta - totalGastos
  const margen         = totalVentas > 0 ? (utilidadBruta / totalVentas) * 100 : 0

  // Serializar para el cliente
  const semanasData = semanas.map((s, i) => ({
    label:   s.label,
    ventas:  Number(semanaVentas[i]._sum.total ?? 0),
    gastos:  Number(semanaGastos[i]._sum.monto ?? 0),
    utilidad: Number(semanaVentas[i]._sum.total ?? 0) - Number(semanaGastos[i]._sum.monto ?? 0),
  }))

  const tipoData = porTipo.map((t) => ({
    tipo:   t.tipo,
    total:  Number(t._sum.total ?? 0),
    count:  t._count.id,
    pct:    totalVentas > 0 ? (Number(t._sum.total ?? 0) / totalVentas) * 100 : 0,
  }))

  const metodoData = porMetodo.map((m) => ({
    metodoPago: m.metodoPago,
    total:      Number(m._sum.total ?? 0),
    count:      m._count.id,
    pct:        totalVentas > 0 ? (Number(m._sum.total ?? 0) / totalVentas) * 100 : 0,
  }))

  const MESES_CORTOS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
  const anualData = mesesAnio.map(([v, g], i) => ({
    mes:     i + 1,
    label:   MESES_CORTOS[i],
    ventas:  Number(v._sum.total ?? 0),
    gastos:  Number(g._sum.monto ?? 0),
    utilidad: Number(v._sum.total ?? 0) - Number(g._sum.monto ?? 0),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground text-sm">Análisis financiero detallado</p>
        </div>
        <MonthSelector mes={mes} anio={anio} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Ventas"        value={totalVentas}  formatFn={formatMXN} previousValue={totalVentasAnt} />
        <KPICard title="Gastos"        value={totalGastos}  formatFn={formatMXN} previousValue={totalGastosAnt} />
        <KPICard title="Utilidad neta" value={utilidadNeta} formatFn={formatMXN} />
        <KPICard title="Margen bruto"  value={margen}       formatFn={(v) => `${v.toFixed(1)}%`} />
      </div>

      {/* Tablas detalladas */}
      <ReportesTablas
        semanas={semanasData}
        porTipo={tipoData}
        porMetodo={metodoData}
        anual={anualData}
        mes={mes}
        anio={anio}
        resumen={{ ventas: totalVentas, gastos: totalGastos, utilidadNeta, margen }}
      />
    </div>
  )
}

function ReportesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-40" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
      </div>
      <Skeleton className="h-96 rounded-lg" />
    </div>
  )
}
