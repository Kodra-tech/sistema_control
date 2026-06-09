import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { invalidateCache, CACHE_KEYS } from "@/lib/cache"
import { inventarioUpdateSchema } from "@/lib/validations/inventario"

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
  const item = await prisma.inventario.findUnique({ where: { id } })
  if (!item) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
  return NextResponse.json({ data: item })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id }   = await params
  const body     = await req.json().catch(() => null)
  const parsed   = inventarioUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const item = await prisma.inventario.findUnique({ where: { id } })
  if (!item) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })

  const { codigo, nombre, descripcion, categoria, unidad, stockActual, stockMinimo, precioUnitario, precioVenta, activo } = parsed.data

  const actualizado = await prisma.inventario.update({
    where: { id },
    data: {
      ...(codigo         !== undefined && { codigo:         codigo ?? null }),
      ...(nombre         !== undefined && { nombre }),
      ...(descripcion    !== undefined && { descripcion:    descripcion ?? null }),
      ...(categoria      !== undefined && { categoria }),
      ...(unidad         !== undefined && { unidad }),
      ...(stockActual    !== undefined && { stockActual }),
      ...(stockMinimo    !== undefined && { stockMinimo }),
      ...(precioUnitario !== undefined && { precioUnitario }),
      ...(precioVenta    !== undefined && { precioVenta:    precioVenta ?? null }),
      ...(activo         !== undefined && { activo }),
    },
  })

  await invalidateCache(CACHE_KEYS.inventario(), CACHE_KEYS.inventarioAlertas())
  return NextResponse.json({ data: actualizado })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const item   = await prisma.inventario.findUnique({ where: { id } })
  if (!item) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })

  await prisma.inventario.delete({ where: { id } })
  await invalidateCache(CACHE_KEYS.inventario(), CACHE_KEYS.inventarioAlertas())
  return NextResponse.json({ data: { id } })
}
