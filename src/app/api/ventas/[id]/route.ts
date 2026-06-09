import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { invalidateCache, CACHE_KEYS } from "@/lib/cache"
import { ventaUpdateSchema } from "@/lib/validations/venta"

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ── GET /api/ventas/[id] ──────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const venta = await prisma.venta.findUnique({
    where: { id },
    include: {
      cliente:    { select: { id: true, nombre: true, apellido: true, telefono: true } },
      inventario: { select: { id: true, nombre: true, stockActual: true, unidad: true } },
    },
  })

  if (!venta) return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
  return NextResponse.json({ data: venta })
}

// ── PATCH /api/ventas/[id] ────────────────────────────────────────────────────
// Solo permite actualizar metodoPago, descuento y notas

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })

  const parsed = ventaUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const venta = await prisma.venta.findUnique({ where: { id } })
  if (!venta) return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })

  const { metodoPago, descuento, notas } = parsed.data
  const nuevoDescuento = descuento ?? Number(venta.descuento)
  const nuevoTotal     = Math.max(0, Number(venta.subtotal) - nuevoDescuento)

  const actualizada = await prisma.venta.update({
    where: { id },
    data: {
      ...(metodoPago !== undefined && { metodoPago }),
      ...(descuento  !== undefined && { descuento:  nuevoDescuento, total: nuevoTotal }),
      ...(notas      !== undefined && { notas: notas ?? null }),
    },
  })

  const mes  = actualizada.fecha.getMonth() + 1
  const anio = actualizada.fecha.getFullYear()
  await invalidateCache(CACHE_KEYS.ventas(mes, anio), CACHE_KEYS.kpis(mes, anio))

  return NextResponse.json({ data: actualizada })
}

// ── DELETE /api/ventas/[id] ───────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const venta = await prisma.venta.findUnique({
    where: { id },
    include: { citaRef: { select: { id: true } } },
  })
  if (!venta) return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })

  // Si la venta está ligada a una cita, deslinkar antes de eliminar
  await prisma.$transaction(async (tx) => {
    if (venta.citaRef) {
      await tx.cita.update({
        where: { id: venta.citaRef.id },
        data:  { ventaId: null },
      })
    }
    // Restaurar stock si era venta de producto
    if (venta.tipo === "producto" && venta.inventarioId) {
      await tx.inventario.update({
        where: { id: venta.inventarioId },
        data:  { stockActual: { increment: venta.cantidad } },
      })
    }
    await tx.venta.delete({ where: { id } })
  })

  const mes  = venta.fecha.getMonth() + 1
  const anio = venta.fecha.getFullYear()
  await invalidateCache(CACHE_KEYS.ventas(mes, anio), CACHE_KEYS.kpis(mes, anio))

  return NextResponse.json({ data: { id } })
}
