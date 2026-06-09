import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSchema = z.object({
  rol:    z.enum(["dueno", "empleado"]).optional(),
  activo: z.boolean().optional(),
})

async function requireAdmin(userId: string): Promise<boolean> {
  const perfil = await prisma.perfil.findUnique({ where: { id: userId }, select: { rol: true } })
  return perfil?.rol !== "empleado"
}

// ── PATCH /api/usuarios/[id] ──────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const isAdmin = await requireAdmin(user.id)
  if (!isAdmin) return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const { id } = await params
  const body   = await req.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 422 })

  const { rol, activo } = parsed.data

  const actualizado = await prisma.perfil.update({
    where: { id },
    data: {
      ...(rol    !== undefined && { rol }),
      ...(activo !== undefined && { activo }),
    },
  })

  return NextResponse.json({ data: actualizado })
}
