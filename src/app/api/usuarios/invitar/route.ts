import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { checkRateLimit } from "@/lib/ratelimit"

const bodySchema = z.object({
  email:  z.string().email(),
  nombre: z.string().min(2),
  rol:    z.enum(["dueno", "empleado"]),
})

// ── POST /api/usuarios/invitar ────────────────────────────────────────────────
// Solo accesible por admins/dueños — verificar en endpoint

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { success: rlOk, headers: rlHeaders } = await checkRateLimit(`invitar:${user.id}`)
  if (!rlOk) return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429, headers: rlHeaders })

  // Verificar rol del solicitante
  const perfil = await prisma.perfil.findUnique({ where: { id: user.id }, select: { rol: true } })
  if (perfil?.rol === "empleado") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const body   = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 422 })
  }

  const { email, nombre, rol } = parsed.data
  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { nombre, rol },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 422 })
  }

  // Pre-crear perfil (se completará cuando el usuario acepte la invitación)
  if (data.user) {
    await prisma.perfil.upsert({
      where:  { id: data.user.id },
      update: {},
      create: { id: data.user.id, nombre, email, rol },
    })
  }

  return NextResponse.json({ data: { email } }, { status: 201 })
}
