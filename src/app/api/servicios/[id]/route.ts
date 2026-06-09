import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { invalidateCache, CACHE_KEYS } from "@/lib/cache"
import { servicioUpdateSchema } from "@/lib/validations/servicios"

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const servicio = await prisma.servicio.findUnique({ where: { id } })
  if (!servicio) return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 })

  return NextResponse.json({ data: servicio })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const existing = await prisma.servicio.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })

  const parsed = servicioUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const { nombre, descripcion, precio, costo, duracion_minutos, categoria, activo } = parsed.data

  const servicio = await prisma.servicio.update({
    where: { id },
    data: {
      ...(nombre            !== undefined && { nombre }),
      ...(descripcion       !== undefined && { descripcion:     descripcion   ?? null }),
      ...(precio            !== undefined && { precio }),
      ...(costo             !== undefined && { costo:           costo         ?? null }),
      ...(duracion_minutos  !== undefined && { duracionMinutos: duracion_minutos }),
      ...(categoria         !== undefined && { categoria:       categoria     ?? null }),
      ...(activo            !== undefined && { activo }),
    },
  })

  await invalidateCache(CACHE_KEYS.servicios(), CACHE_KEYS.servicio(id))
  return NextResponse.json({ data: servicio })
}

// Soft delete
export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const existing = await prisma.servicio.findUnique({ where: { id } })
  if (!existing)        return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 })
  if (!existing.activo) return NextResponse.json({ error: "El servicio ya está inactivo" }, { status: 409 })

  const servicio = await prisma.servicio.update({ where: { id }, data: { activo: false } })
  await invalidateCache(CACHE_KEYS.servicios(), CACHE_KEYS.servicio(id))
  return NextResponse.json({ data: servicio })
}
