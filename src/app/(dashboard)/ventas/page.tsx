import { Suspense } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { VentaTable } from "@/components/ventas/VentaTable"
import { VentaTableSkeleton } from "@/components/ventas/VentaTableSkeleton"

interface PageProps {
  searchParams: Promise<{
    mes?: string; anio?: string; tipo?: string; metodo_pago?: string; page?: string
  }>
}

export default function VentasPage({ searchParams }: PageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ventas</h1>
          <p className="text-muted-foreground text-sm">Registro de ingresos</p>
        </div>
        <Button asChild>
          <Link href="/ventas/nueva">
            <Plus className="h-4 w-4 mr-1" /> Nueva venta
          </Link>
        </Button>
      </div>

      <Suspense fallback={<VentaTableSkeleton />}>
        <VentasContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function VentasContent({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const params    = await searchParams
  const ahora     = new Date()
  const mes       = params.mes  ? parseInt(params.mes,  10) : ahora.getMonth() + 1
  const anio      = params.anio ? parseInt(params.anio, 10) : ahora.getFullYear()
  const tipo      = params.tipo?.trim()        ?? ""
  const metodo    = params.metodo_pago?.trim() ?? ""
  const page      = Math.max(1, parseInt(params.page ?? "1", 10))
  const pageSize  = 50

  const desde = new Date(anio, mes - 1, 1)
  const hasta = new Date(anio, mes,     0)

  const where: Record<string, unknown> = { fecha: { gte: desde, lte: hasta } }
  if (tipo)   where["tipo"]       = tipo
  if (metodo) where["metodoPago"] = metodo

  const [ventas, total, resumenAgg] = await Promise.all([
    prisma.venta.findMany({
      where,
      orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { cliente: { select: { id: true, nombre: true, apellido: true } } },
    }),
    prisma.venta.count({ where }),
    prisma.venta.aggregate({ where, _sum: { total: true } }),
  ])

  // Calcular utilidad total del período
  const todasVentas = await prisma.venta.findMany({
    where,
    select: { precioUnitario: true, costoUnitario: true, cantidad: true },
  })
  const utilidad = todasVentas.reduce((acc, v) => {
    if (!v.precioUnitario || !v.costoUnitario) return acc
    return acc + (Number(v.precioUnitario) - Number(v.costoUnitario)) * v.cantidad
  }, 0)

  return (
    <VentaTable
      ventas={ventas.map((v) => ({
        ...v,
        fecha:          v.fecha.toISOString(),
        subtotal:       Number(v.subtotal),
        descuento:      Number(v.descuento),
        total:          Number(v.total),
        precioUnitario: v.precioUnitario ? Number(v.precioUnitario) : null,
        costoUnitario:  v.costoUnitario  ? Number(v.costoUnitario)  : null,
        cliente:        v.cliente,
      }))}
      total={total}
      resumen={{
        ventas:   Number(resumenAgg._sum.total ?? 0),
        subtotal: Number(resumenAgg._sum.total ?? 0),
        utilidad,
      }}
      defaultMes={mes}
      defaultAnio={anio}
    />
  )
}
