import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { invalidateCache, CACHE_KEYS } from "@/lib/cache"
import { gastoUpdateSchema } from "@/lib/validations/gasto"

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
  const gasto = await prisma.gasto.findUnique({ where: { id } })
  if (!gasto) return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 })
  return NextResponse.json({ data: gasto })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })

  const parsed = gastoUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const gasto = await prisma.gasto.findUnique({ where: { id } })
  if (!gasto) return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 })

  const { concepto, monto, categoria, fecha, comprobante, notas } = parsed.data
  const nuevaFecha = fecha ? new Date(fecha) : undefined

  const actualizado = await prisma.gasto.update({
    where: { id },
    data: {
      ...(concepto    !== undefined && { concepto }),
      ...(monto       !== undefined && { monto }),
      ...(categoria   !== undefined && { categoria }),
      ...(nuevaFecha  !== undefined && { fecha: nuevaFecha }),
      ...(comprobante !== undefined && { comprobante: comprobante || null }),
      ...(notas       !== undefined && { notas: notas ?? null }),
    },
  })

  const mesOrig  = gasto.fecha.getMonth() + 1
  const anioOrig = gasto.fecha.getFullYear()
  const mesNuevo  = actualizado.fecha.getMonth() + 1
  const anioNuevo = actualizado.fecha.getFullYear()
  const keysInv   = [CACHE_KEYS.gastos(mesOrig, anioOrig), CACHE_KEYS.kpis(mesOrig, anioOrig)]
  if (mesNuevo !== mesOrig || anioNuevo !== anioOrig) {
    keysInv.push(CACHE_KEYS.gastos(mesNuevo, anioNuevo), CACHE_KEYS.kpis(mesNuevo, anioNuevo))
  }
  await invalidateCache(...keysInv)

  return NextResponse.json({ data: actualizado })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const gasto = await prisma.gasto.findUnique({ where: { id } })
  if (!gasto) return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 })

  await prisma.gasto.delete({ where: { id } })

  const mes  = gasto.fecha.getMonth() + 1
  const anio = gasto.fecha.getFullYear()
  await invalidateCache(CACHE_KEYS.gastos(mes, anio), CACHE_KEYS.kpis(mes, anio))

  return NextResponse.json({ data: { id } })
}
