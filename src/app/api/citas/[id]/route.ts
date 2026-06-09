import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { invalidateCache, CACHE_KEYS } from "@/lib/cache"
import { citaUpdateSchema, TRANSICIONES_ESTADO, type EstadoCita } from "@/lib/validations/cita"

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ── GET /api/citas/[id] ───────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params

  const cita = await prisma.cita.findUnique({
    where: { id },
    include: {
      cliente:  { select: { id: true, nombre: true, apellido: true, telefono: true, email: true } },
      servicio: { select: { id: true, nombre: true, precio: true, costo: true, duracionMinutos: true, categoria: true } },
    },
  })

  if (!cita) return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
  return NextResponse.json({ data: cita })
}

// ── PATCH /api/citas/[id] ─────────────────────────────────────────────────────
// Solo actualiza `estado` y `notas`

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })

  const parsed = citaUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const cita = await prisma.cita.findUnique({ where: { id } })
  if (!cita) return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })

  const { estado, notas } = parsed.data

  // Validar transición de estado
  if (estado && estado !== cita.estado) {
    const transicionesValidas = TRANSICIONES_ESTADO[cita.estado as EstadoCita] ?? []
    if (!transicionesValidas.includes(estado)) {
      return NextResponse.json(
        { error: `Transición inválida: no se puede pasar de "${cita.estado}" a "${estado}"` },
        { status: 422 },
      )
    }
  }

  const actualizada = await prisma.cita.update({
    where: { id },
    data: {
      ...(estado !== undefined && { estado }),
      ...(notas  !== undefined && { notas: notas ?? null }),
    },
    include: {
      cliente:  { select: { id: true, nombre: true, apellido: true } },
      servicio: { select: { id: true, nombre: true, precio: true } },
    },
  })

  const fechaISO = actualizada.fecha.toISOString().split("T")[0]
  await invalidateCache(CACHE_KEYS.citasDia(fechaISO), CACHE_KEYS.citasHoy())

  return NextResponse.json({ data: actualizada })
}

// ── DELETE /api/citas/[id] ────────────────────────────────────────────────────
// Solo si estado es `pendiente` o `cancelada`

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params

  const cita = await prisma.cita.findUnique({ where: { id } })
  if (!cita) return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })

  if (!["pendiente", "cancelada"].includes(cita.estado)) {
    return NextResponse.json(
      { error: `No se puede eliminar una cita con estado "${cita.estado}"` },
      { status: 422 },
    )
  }

  await prisma.cita.delete({ where: { id } })

  const fechaISO = cita.fecha.toISOString().split("T")[0]
  await invalidateCache(CACHE_KEYS.citasDia(fechaISO), CACHE_KEYS.citasHoy())

  return NextResponse.json({ data: { id } })
}
