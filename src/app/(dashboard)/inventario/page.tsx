import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { InventarioTable } from "@/components/inventario/InventarioTable"
import { InventarioTableSkeleton } from "@/components/inventario/InventarioTableSkeleton"

interface PageProps {
  searchParams: Promise<{ q?: string; categoria?: string; activo?: string; alerta?: string; page?: string }>
}

export default function InventarioPage({ searchParams }: PageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>
        <p className="text-muted-foreground text-sm">Gestión de productos y stock</p>
      </div>
      <Suspense fallback={<InventarioTableSkeleton />}>
        <InventarioContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function InventarioContent({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const params    = await searchParams
  const q         = params.q?.trim()         ?? ""
  const categoria = params.categoria?.trim() ?? ""
  const activo    = params.activo !== "false"
  const soloAlerta = params.alerta === "true"
  const page      = Math.max(1, parseInt(params.page ?? "1", 10))
  const pageSize  = 50

  const where: Record<string, unknown> = { activo }
  if (q)         where["nombre"]    = { contains: q, mode: "insensitive" as const }
  if (categoria) where["categoria"] = categoria

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

  return (
    <InventarioTable
      items={items.map((i) => ({
        ...i,
        stockActual:    Number(i.stockActual),
        stockMinimo:    Number(i.stockMinimo),
        precioUnitario: Number(i.precioUnitario),
        precioVenta:    i.precioVenta ? Number(i.precioVenta) : null,
      }))}
      total={soloAlerta ? items.length : total}
      defaultQ={q}
      defaultActivo={activo}
    />
  )
}
