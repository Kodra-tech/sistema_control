import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { invalidateCache, CACHE_KEYS } from "@/lib/cache"
import { convertirCitaSchema } from "@/lib/validations/cita"
import { checkRateLimit } from "@/lib/ratelimit"

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ── POST /api/citas/[id]/convertir ────────────────────────────────────────────
// Convierte una cita realizada en venta via $transaction

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { success: rlOk, headers: rlHeaders } = await checkRateLimit(`convertir:${user.id}`)
  if (!rlOk) return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429, headers: rlHeaders })

  const { id } = await params

  const body = await req.json().catch(() => ({}))
  const parsed = convertirCitaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }
  const { metodoPago = "efectivo", descuento = 0, notas } = parsed.data

  const cita = await prisma.cita.findUnique({
    where: { id },
    include: {
      servicio: { select: { nombre: true, precio: true, costo: true } },
      cliente:  { select: { id: true } },
    },
  })

  if (!cita) return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })

  // Verificar estado = 'realizada'
  if (cita.estado !== "realizada") {
    return NextResponse.json(
      { error: `La cita debe estar en estado "realizada" para convertirse en venta (estado actual: "${cita.estado}")` },
      { status: 422 },
    )
  }

  // Verificar no convertida ya
  if (cita.ventaId !== null) {
    return NextResponse.json(
      { error: "Esta cita ya fue convertida en venta" },
      { status: 409 },
    )
  }

  const precio    = Number(cita.servicio.precio)
  const subtotal  = precio
  const total     = Math.max(0, subtotal - descuento)

  // Transacción: crear venta + vincular cita
  const venta = await prisma.$transaction(async (tx) => {
    const nuevaVenta = await tx.venta.create({
      data: {
        clienteId:  cita.clienteId,
        citaId:     cita.id,
        subtotal,
        descuento,
        total,
        metodoPago,
        fecha:      cita.fecha,
        notas:      notas ?? null,
      },
    })

    await tx.cita.update({
      where: { id: cita.id },
      data:  { ventaId: nuevaVenta.id },
    })

    return nuevaVenta
  })

  const fechaISO = cita.fecha.toISOString().split("T")[0]
  await invalidateCache(CACHE_KEYS.citasDia(fechaISO), CACHE_KEYS.citasHoy())

  return NextResponse.json({ data: venta }, { status: 201 })
}
