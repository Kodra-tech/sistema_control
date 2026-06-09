import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { invalidateCache, CACHE_KEYS } from "@/lib/cache"
import { clienteUpdateSchema } from "@/lib/validations/clientes"

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

type Params = { params: Promise<{ id: string }> }

// ── GET /api/clientes/[id] ────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params

  const cliente = await prisma.cliente.findUnique({ where: { id } })
  if (!cliente) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })

  return NextResponse.json({ data: cliente })
}

// ── PUT /api/clientes/[id] ────────────────────────────────────────────────────

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params

  const existing = await prisma.cliente.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })

  const parsed = clienteUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const { nombre, telefono, email, notas } = parsed.data

  const cliente = await prisma.cliente.update({
    where: { id },
    data: {
      ...(nombre    !== undefined && { nombre }),
      ...(telefono  !== undefined && { telefono: telefono ?? null }),
      ...(email     !== undefined && { email:    email    || null }),
      ...(notas     !== undefined && { notas:    notas    ?? null }),
    },
  })

  await invalidateCache(
    CACHE_KEYS.clientes(true),
    CACHE_KEYS.clientes(false),
    CACHE_KEYS.cliente(id),
  )

  return NextResponse.json({ data: cliente })
}

// ── DELETE /api/clientes/[id] — hard delete ───────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params

  const existing = await prisma.cliente.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })

  await prisma.cliente.delete({ where: { id } })

  await invalidateCache(
    CACHE_KEYS.clientes(true),
    CACHE_KEYS.clientes(false),
    CACHE_KEYS.cliente(id),
  )

  return NextResponse.json({ data: { id } })
}
