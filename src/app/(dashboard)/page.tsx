import { Suspense } from "react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { KPICard } from "@/components/dashboard/KPICard"
import { VentasMensualesChart } from "@/components/dashboard/VentasMensualesChart"
import { TopServiciosChart } from "@/components/dashboard/TopServiciosChart"
import { GastosPieChart } from "@/components/gastos/GastosPieChart"
import { CitasHoyWidget } from "@/components/dashboard/CitasHoyWidget"
import { MonthSelector } from "@/components/shared/MonthSelector"
import { AccessDeniedToast } from "@/components/dashboard/AccessDeniedToast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMXN } from "@/lib/utils/currency"

interface PageProps {
  searchParams: Promise<{ mes?: string; anio?: string }>
}

const MESES_CORTOS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

export default function DashboardPage({ searchParams }: PageProps) {
  return (
    <>
      <Suspense fallback={null}><AccessDeniedToast /></Suspense>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent searchParams={searchParams} />
      </Suspense>
    </>
  )
}

async function DashboardContent({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const params = await searchParams
  const ahora  = new Date()
  const mes    = parseInt(params.mes  ?? String(ahora.getMonth() + 1), 10)
  const anio   = parseInt(params.anio ?? String(ahora.getFullYear()),  10)

  const desde     = new Date(anio, mes - 1, 1)
  const hasta     = new Date(anio, mes,     0)
  const mesAnt    = mes  === 1 ? 12     : mes - 1
  const anioAnt   = mes  === 1 ? anio - 1 : anio
  const desdeAnt  = new Date(anioAnt, mesAnt - 1, 1)
  const hastaAnt  = new Date(anioAnt, mesAnt,     0)

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  // Calcular últimos 12 meses para el chart
  const meses12: { mes: number; anio: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(anio, mes - 1 - i, 1)
    meses12.push({ mes: d.getMonth() + 1, anio: d.getFullYear() })
  }
  const desde12 = new Date(meses12[0].anio,  meses12[0].mes  - 1, 1)
  const hasta12  = new Date(meses12[11].anio, meses12[11].mes - 1 + 1, 0)

  const [
    ventasMes, ventasAnt, gastosMes, gastosAnt,
    topServicios, gastosPorCat, citasHoy,
    stockBajoItems, ventasAll12, gastos12,
  ] = await Promise.all([
    prisma.venta.aggregate({ where: { fecha: { gte: desde, lte: hasta } }, _sum: { total: true } }),
    prisma.venta.aggregate({ where: { fecha: { gte: desdeAnt, lte: hastaAnt } }, _sum: { total: true } }),
    prisma.gasto.aggregate({ where: { fecha: { gte: desde, lte: hasta } }, _sum: { monto: true } }),
    prisma.gasto.aggregate({ where: { fecha: { gte: desdeAnt, lte: hastaAnt } }, _sum: { monto: true } }),
    prisma.venta.groupBy({
      by: ["concepto"],
      where: { fecha: { gte: desde, lte: hasta }, tipo: "servicio", concepto: { not: null } },
      _count: { id: true }, _sum: { total: true },
      orderBy: { _sum: { total: "desc" } }, take: 5,
    }),
    prisma.gasto.groupBy({
      by: ["categoria"],
      where: { fecha: { gte: desde, lte: hasta } },
      _sum: { monto: true }, orderBy: { _sum: { monto: "desc" } },
    }),
    prisma.cita.findMany({
      where: { fecha: hoy },
      orderBy: { horaInicio: "asc" },
      include: { cliente: { select: { nombre: true, apellido: true } }, servicio: { select: { nombre: true } } },
    }),
    prisma.inventario.findMany({
      where: { activo: true, stockActual: { lte: prisma.inventario.fields.stockMinimo } },
      select: { id: true, nombre: true, stockActual: true, stockMinimo: true, unidad: true },
      take: 5,
    }),
    prisma.venta.findMany({
      where: { fecha: { gte: desde12, lte: hasta12 } },
      select: { fecha: true, total: true, precioUnitario: true, costoUnitario: true, cantidad: true },
    }),
    prisma.gasto.findMany({
      where: { fecha: { gte: desde12, lte: hasta12 } },
      select: { fecha: true, monto: true },
    }),
  ])

  // KPIs
  const totalVentas   = Number(ventasMes._sum.total  ?? 0)
  const totalGastos   = Number(gastosMes._sum.monto  ?? 0)
  const totalVentasAnt = Number(ventasAnt._sum.total ?? 0)
  const totalGastosAnt = Number(gastosAnt._sum.monto ?? 0)

  const utilidadBruta = ventasAll12
    .filter((v) => {
      const d = new Date(v.fecha)
      return d.getMonth() + 1 === mes && d.getFullYear() === anio
    })
    .reduce((acc, v) => {
      if (!v.precioUnitario || !v.costoUnitario) return acc
      return acc + (Number(v.precioUnitario) - Number(v.costoUnitario)) * v.cantidad
    }, 0)

  const utilidadNeta  = utilidadBruta - totalGastos
  const margen        = totalVentas > 0 ? (utilidadBruta / totalVentas) * 100 : 0
  const utilidadAnt   = -totalGastosAnt  // simplificado para comparativa

  // Chart data — 12 meses
  const ventasMapa12: Record<string, number>      = {}
  const gastosMapa12: Record<string, number>      = {}
  const utilidadMapa12: Record<string, number>    = {}

  ventasAll12.forEach((v) => {
    const key = `${new Date(v.fecha).getFullYear()}-${new Date(v.fecha).getMonth()}`
    ventasMapa12[key]   = (ventasMapa12[key]   ?? 0) + Number(v.total)
    const u = v.precioUnitario && v.costoUnitario
      ? (Number(v.precioUnitario) - Number(v.costoUnitario)) * v.cantidad : 0
    utilidadMapa12[key] = (utilidadMapa12[key] ?? 0) + u
  })
  gastos12.forEach((g) => {
    const key = `${new Date(g.fecha).getFullYear()}-${new Date(g.fecha).getMonth()}`
    gastosMapa12[key] = (gastosMapa12[key] ?? 0) + Number(g.monto)
  })

  const chartData = meses12.map(({ mes: m, anio: a }) => {
    const key = `${a}-${m - 1}`
    const v   = ventasMapa12[key]   ?? 0
    const g   = gastosMapa12[key]   ?? 0
    const u   = utilidadMapa12[key] ?? 0
    return { mes_label: MESES_CORTOS[m - 1], ventas_totales: v, gastos_totales: g, utilidad_neta: u - g }
  })

  const pieData = gastosPorCat.map((g) => ({
    categoria: g.categoria,
    total:     Number(g._sum.monto ?? 0),
  }))

  const topSvcs = topServicios.map((s) => ({
    concepto: s.concepto ?? "",
    count:    s._count.id,
    total:    Number(s._sum.total ?? 0),
  }))

  return (
    <div className="space-y-6">
      {/* Header con MonthSelector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Resumen financiero del salón</p>
        </div>
        <MonthSelector mes={mes} anio={anio} />
      </div>

      {/* Alertas de stock */}
      {stockBajoItems.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            <span className="font-medium">Stock bajo: </span>
            {stockBajoItems.map((p) => `${p.nombre} (${Number(p.stockActual)} ${p.unidad})`).join(", ")}
            {" · "}
            <Link href="/inventario" className="underline">Ver inventario</Link>
          </AlertDescription>
        </Alert>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Ventas del mes"
          value={totalVentas}
          formatFn={formatMXN}
          previousValue={totalVentasAnt}
        />
        <KPICard
          title="Utilidad neta"
          value={utilidadNeta}
          formatFn={formatMXN}
          previousValue={utilidadAnt}
        />
        <KPICard
          title="Margen bruto"
          value={margen}
          suffix="%"
          formatFn={(v) => `${v.toFixed(1)}%`}
        />
        <KPICard
          title="Citas hoy"
          value={citasHoy.length}
          description={`${citasHoy.filter((c) => c.estado === "confirmada").length} confirmadas`}
        />
      </div>

      {/* Gráfica 12 meses */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ventas vs Gastos — últimos 12 meses</CardTitle>
        </CardHeader>
        <CardContent>
          <VentasMensualesChart data={chartData} />
        </CardContent>
      </Card>

      {/* Row: top servicios + gastos donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top 5 servicios del mes</CardTitle>
          </CardHeader>
          <CardContent>
            <TopServiciosChart data={topSvcs} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Gastos por categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <GastosPieChart data={pieData} totalGastos={totalGastos} />
          </CardContent>
        </Card>
      </div>

      {/* Citas hoy */}
      <CitasHoyWidget citas={citasHoy} />
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-8 w-40" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
      </div>
      <Skeleton className="h-72 rounded-lg" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-56 rounded-lg" />
        <Skeleton className="h-56 rounded-lg" />
      </div>
    </div>
  )
}
