import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { CompraTable } from "@/components/compras/CompraTable"
import { Skeleton } from "@/components/ui/skeleton"

export default function ComprasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compras</h1>
        <p className="text-muted-foreground text-sm">Registro de reabastecimiento de inventario</p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 rounded-lg" />}>
        <ComprasContent />
      </Suspense>
    </div>
  )
}

async function ComprasContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [compras, total] = await Promise.all([
    prisma.compra.findMany({
      orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
      take: 100,
      include: { producto: { select: { id: true, nombre: true, unidad: true } } },
    }),
    prisma.compra.count(),
  ])

  return (
    <CompraTable
      compras={compras.map((c) => ({
        ...c,
        fecha:          c.fecha.toISOString(),
        cantidad:       Number(c.cantidad),
        precioUnitario: Number(c.precioUnitario),
        total:          Number(c.total),
      }))}
      total={total}
    />
  )
}
