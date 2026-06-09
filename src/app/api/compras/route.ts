import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { invalidateCache, CACHE_KEYS } from "@/lib/cache"
import { compraSchema } from "@/lib/validations/compra"
import { checkRateLimit } from "@/lib/ratelimit"

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ── GET /api/compras ──────────────────────────────────────────────────────────
// Query: producto_id, page, pageSize

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const productoId = searchParams.get("producto_id")?.trim() ?? ""
  const page       = Math.max(1, parseInt(searchParams.get("page")     ?? "1",  10))
  const pageSize   = Math.min(100, parseInt(searchParams.get("pageSize") ?? "50", 10))

  const where: Record<string, unknown> = {}
  if (productoId) where["productoId"] = productoId

  const [items, total] = await Promise.all([
    prisma.compra.findMany({
      where,
      orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      include: { producto: { select: { id: true, nombre: true, unidad: true } } },
    }),
    prisma.compra.count({ where }),
  ])

  return NextResponse.json({ data: { items, total, page, pageSize } })
}

// ── POST /api/compras ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { success: rlOk, headers: rlHeaders } = await checkRateLimit(`compras:${user.id}`)
  if (!rlOk) return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429, headers: rlHeaders })

  const body   = await req.json().catch(() => null)
  const parsed = compraSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const { productoId, cantidad, precioUnitario, proveedor, fecha, notas } = parsed.data
  const total     = cantidad * precioUnitario
  const fechaDate = new Date(fecha)

  // Verificar que el producto existe
  const producto = await prisma.inventario.findUnique({
    where:  { id: productoId },
    select: { id: true, nombre: true, stockActual: true, unidad: true },
  })
  if (!producto) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })

  // Transacción: crear compra + incrementar stock
  const compra = await prisma.$transaction(async (tx) => {
    const nuevaCompra = await tx.compra.create({
      data: {
        productoId,
        cantidad,
        precioUnitario,
        total,
        proveedor: proveedor ?? null,
        fecha:     fechaDate,
        notas:     notas ?? null,
      },
    })

    await tx.inventario.update({
      where: { id: productoId },
      data:  { stockActual: { increment: cantidad } },
    })

    return nuevaCompra
  })

  const nuevoStock = Number(producto.stockActual) + cantidad

  await invalidateCache(CACHE_KEYS.inventario(), CACHE_KEYS.inventarioAlertas())

  return NextResponse.json({
    data: compra,
    mensaje: `Stock actualizado: ahora hay ${nuevoStock} ${producto.unidad}${nuevoStock !== 1 ? "s" : ""} de ${producto.nombre}`,
  }, { status: 201 })
}
