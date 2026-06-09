import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { GastoTable } from "@/components/gastos/GastoTable"
import { GastosPieChart } from "@/components/gastos/GastosPieChart"
import { GastoTableSkeleton } from "@/components/gastos/GastoTableSkeleton"

interface PageProps {
  searchParams: Promise<{
    mes?: string; anio?: string; categoria?: string; page?: string
  }>
}

export default function GastosPage({ searchParams }: PageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gastos</h1>
        <p className="text-muted-foreground text-sm">Control de egresos</p>
      </div>

      <Suspense fallback={<GastoTableSkeleton />}>
        <GastosContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function GastosContent({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const params    = await searchParams
  const ahora     = new Date()
  const mes       = params.mes       ? parseInt(params.mes,   10) : ahora.getMonth() + 1
  const anio      = params.anio      ? parseInt(params.anio,  10) : ahora.getFullYear()
  const categoria = params.categoria?.trim() ?? ""

  const desde = new Date(anio, mes - 1, 1)
  const hasta = new Date(anio, mes,     0)

  const where: Record<string, unknown> = { fecha: { gte: desde, lte: hasta } }
  if (categoria) where["categoria"] = categoria

  const [gastos, total, resumenAgg, porCategoria] = await Promise.all([
    prisma.gasto.findMany({
      where,
      orderBy: [{ categoria: "asc" }, { fecha: "desc" }],
    }),
    prisma.gasto.count({ where }),
    prisma.gasto.aggregate({ where, _sum: { monto: true } }),
    prisma.gasto.groupBy({
      by: ["categoria"],
      where: { fecha: { gte: desde, lte: hasta } },  // sin filtro de categoria para el pie chart
      _sum: { monto: true },
      orderBy: { _sum: { monto: "desc" } },
    }),
  ])

  const totalGastos     = Number(resumenAgg._sum.monto ?? 0)
  const pieData         = porCategoria.map((g) => ({
    categoria: g.categoria,
    total:     Number(g._sum.monto ?? 0),
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Gráfica — 1 columna */}
      <div className="lg:col-span-1">
        <div className="rounded-lg border bg-card p-4">
          <h2 className="text-sm font-semibold mb-3">Por categoría</h2>
          <GastosPieChart data={pieData} totalGastos={totalGastos} />
        </div>
      </div>

      {/* Tabla — 2 columnas */}
      <div className="lg:col-span-2">
        <GastoTable
          gastos={gastos.map((g) => ({ ...g, monto: Number(g.monto), fecha: g.fecha.toISOString() }))}
          total={total}
          totalGastos={totalGastos}
          defaultMes={mes}
          defaultAnio={anio}
        />
      </div>
    </div>
  )
}
