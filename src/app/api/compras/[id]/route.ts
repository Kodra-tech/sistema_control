import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { invalidateCache, CACHE_KEYS } from "@/lib/cache"

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { id } = await params
  const compra  = await prisma.compra.findUnique({
    where: { id },
    include: { producto: { select: { id: true, nombre: true, unidad: true } } },
  })
  if (!compra) return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 })
  return NextResponse.json({ data: compra })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const compra  = await prisma.compra.findUnique({ where: { id } })
  if (!compra) return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 })

  // Revertir incremento de stock
  await prisma.$transaction(async (tx) => {
    await tx.inventario.update({
      where: { id: compra.productoId },
      data:  { stockActual: { decrement: compra.cantidad } },
    })
    await tx.compra.delete({ where: { id } })
  })

  await invalidateCache(CACHE_KEYS.inventario(), CACHE_KEYS.inventarioAlertas())
  return NextResponse.json({ data: { id } })
}
