import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { withCache, invalidateCache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache"
import { citaSchema } from "@/lib/validations/cita"
import { sendConfirmacionCita } from "@/lib/email"
import { checkRateLimit } from "@/lib/ratelimit"

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ── GET /api/citas ────────────────────────────────────────────────────────────
// Query params: fecha (YYYY-MM-DD | "hoy"), estado, cliente_id

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const fechaParam     = searchParams.get("fecha")?.trim()       ?? ""
  const fechaDesde     = searchParams.get("fecha_desde")?.trim() ?? ""
  const fechaHasta     = searchParams.get("fecha_hasta")?.trim() ?? ""
  const estadoParam    = searchParams.get("estado")?.trim()      ?? ""
  const clienteIdParam = searchParams.get("cliente_id")?.trim()  ?? ""

  const hoyISO = new Date().toISOString().split("T")[0]
  const fechaStr = fechaParam === "hoy" ? hoyISO : fechaParam || ""

  const where: Record<string, unknown> = {}
  if (fechaStr) {
    where["fecha"] = new Date(fechaStr)
  } else if (fechaDesde || fechaHasta) {
    const fechaFilter: Record<string, Date> = {}
    if (fechaDesde) fechaFilter["gte"] = new Date(fechaDesde)
    if (fechaHasta) fechaFilter["lte"] = new Date(fechaHasta)
    where["fecha"] = fechaFilter
  }
  if (estadoParam)    where["estado"]    = estadoParam
  if (clienteIdParam) where["clienteId"] = clienteIdParam

  const fetcher = async () => {
    const citas = await prisma.cita.findMany({
      where,
      orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
      include: {
        cliente:  { select: { id: true, nombre: true, apellido: true, telefono: true, email: true } },
        servicio: { select: { id: true, nombre: true, precio: true, duracionMinutos: true, categoria: true } },
      },
    })
    return { items: citas, total: citas.length }
  }

  // Cache solo la consulta de hoy sin filtros adicionales
  const esDiaHoy = fechaStr === hoyISO && !estadoParam && !clienteIdParam && !fechaDesde && !fechaHasta
  if (esDiaHoy) {
    const data = await withCache(CACHE_KEYS.citasDia(hoyISO), CACHE_TTL.citasDia, fetcher)
    return NextResponse.json({ data })
  }

  const data = await fetcher()
  return NextResponse.json({ data })
}

// ── POST /api/citas ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { success: rlOk, headers: rlHeaders } = await checkRateLimit(`citas:${user.id}`)
  if (!rlOk) return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429, headers: rlHeaders })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })

  const parsed = citaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const { clienteId, servicioId, fecha, hora, notas } = parsed.data

  // Construir fecha y hora
  const fechaDate = new Date(fecha)

  // horaInicio como objeto Date con la hora dada (la parte fecha es arbitraria para @db.Time)
  const [hh, mm] = hora.split(":").map(Number)
  const horaDate = new Date(1970, 0, 1, hh, mm, 0)

  // Detectar conflicto: citas en ±30 min en la misma fecha (excepto canceladas/no_asistio)
  const windowMs = 30 * 60 * 1000 // 30 minutos en ms
  const horaMs   = hh * 3600000 + mm * 60000

  const citasDia = await prisma.cita.findMany({
    where: {
      fecha:  fechaDate,
      estado: { notIn: ["cancelada", "no_asistio"] },
    },
    select: { id: true, horaInicio: true, servicio: { select: { nombre: true } } },
  })

  const conflicto = citasDia.find((c) => {
    const cH = c.horaInicio
    const cMs = cH.getHours() * 3600000 + cH.getMinutes() * 60000
    return Math.abs(cMs - horaMs) < windowMs
  })

  if (conflicto) {
    const h = conflicto.horaInicio
    const hStr = `${String(h.getHours()).padStart(2, "0")}:${String(h.getMinutes()).padStart(2, "0")}`
    return NextResponse.json(
      {
        error: `Conflicto de horario: ya hay una cita de "${conflicto.servicio.nombre}" a las ${hStr}. Elige un horario con al menos 30 minutos de diferencia.`,
        conflicto: { hora: hStr, servicio: conflicto.servicio.nombre },
      },
      { status: 409 },
    )
  }

  // Obtener duración del servicio para calcular hora_fin
  const servicio = await prisma.servicio.findUnique({
    where: { id: servicioId },
    select: { duracionMinutos: true, nombre: true, precio: true },
  })
  if (!servicio) return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 })

  const horaFinMs = horaMs + servicio.duracionMinutos * 60000
  const horaFin   = new Date(1970, 0, 1, Math.floor(horaFinMs / 3600000) % 24, Math.floor((horaFinMs % 3600000) / 60000))

  const cita = await prisma.cita.create({
    data: {
      clienteId,
      servicioId,
      fecha:      fechaDate,
      horaInicio: horaDate,
      horaFin,
      notas:      notas ?? null,
    },
    include: {
      cliente:  { select: { id: true, nombre: true, apellido: true, email: true } },
      servicio: { select: { id: true, nombre: true, precio: true } },
    },
  })

  const fechaISO = fechaDate.toISOString().split("T")[0]
  await invalidateCache(CACHE_KEYS.citasDia(fechaISO), CACHE_KEYS.citasHoy())

  // Enviar email de confirmación (fire-and-forget)
  if (cita.cliente.email) {
    const emailCliente = { ...cita.cliente, email: cita.cliente.email }
    sendConfirmacionCita(
      { fecha, hora, notas: notas ?? null },
      emailCliente,
      cita.servicio,
    ).catch((err: unknown) => {
      console.error("[email] Error al enviar confirmación de cita:", err)
    })
  }

  return NextResponse.json({ data: cita }, { status: 201 })
}
