import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ClienteTable } from "@/components/clientes/ClienteTable"
import { ClienteTableSkeleton } from "@/components/clientes/ClienteTableSkeleton"

interface PageProps {
  searchParams: Promise<{ q?: string; activo?: string; page?: string }>
}

export default function ClientesPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<ClienteTableSkeleton />}>
      <ClientesContent searchParams={searchParams} />
    </Suspense>
  )
}

async function ClientesContent({ searchParams }: PageProps) {
  // Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Params
  const params    = await searchParams
  const q         = params.q?.trim() ?? ""
  const activo    = params.activo !== "false"
  const page      = Math.max(1, parseInt(params.page ?? "1", 10))
  const pageSize  = 20

  const where = {
    activo,
    ...(q
      ? {
          OR: [
            { nombre:   { contains: q, mode: "insensitive" as const } },
            { apellido: { contains: q, mode: "insensitive" as const } },
            { telefono: { contains: q } },
          ],
        }
      : {}),
  }

  const [clientes, total] = await Promise.all([
    prisma.cliente.findMany({
      where,
      orderBy: { nombre: "asc" },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
    }),
    prisma.cliente.count({ where }),
  ])

  return (
    <ClienteTable
      clientes={clientes}
      total={total}
      defaultQ={q}
      defaultActivo={activo}
    />
  )
}
