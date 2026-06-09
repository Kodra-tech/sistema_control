import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { ServicioTable } from "@/components/servicios/ServicioTable"
import { ServicioTableSkeleton } from "@/components/servicios/ServicioTableSkeleton"

interface PageProps {
  searchParams: Promise<{ q?: string; activo?: string; categoria?: string; page?: string }>
}

export default function ServiciosPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<ServicioTableSkeleton />}>
      <ServiciosContent searchParams={searchParams} />
    </Suspense>
  )
}

async function ServiciosContent({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const params    = await searchParams
  const q         = params.q?.trim() ?? ""
  const activo    = params.activo !== "false"
  const categoria = params.categoria?.trim() ?? ""
  const page      = Math.max(1, parseInt(params.page ?? "1", 10))
  const pageSize  = 50

  const where = {
    activo,
    ...(q ? {
      OR: [
        { nombre:    { contains: q, mode: "insensitive" as const } },
        { categoria: { contains: q, mode: "insensitive" as const } },
      ],
    } : {}),
    ...(categoria ? { categoria: { equals: categoria, mode: "insensitive" as const } } : {}),
  }

  const [servicios, total] = await Promise.all([
    prisma.servicio.findMany({
      where,
      orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.servicio.count({ where }),
  ])

  return (
    <ServicioTable
      servicios={servicios}
      total={total}
      defaultQ={q}
      defaultActivo={activo}
      defaultCat={categoria}
    />
  )
}
