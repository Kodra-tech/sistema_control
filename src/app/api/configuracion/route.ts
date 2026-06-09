import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { withCache, invalidateCache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache"
import { configuracionSchema } from "@/lib/validations/configuracion"

// ── helpers ───────────────────────────────────────────────────────────────────

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", userId)
    .single()
  return data?.rol !== "empleado"
}

// ── GET /api/configuracion ────────────────────────────────────────────────────

export async function GET() {
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!(await isAdmin(supabase, user.id)))
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const data = await withCache(CACHE_KEYS.configuracion(), CACHE_TTL.configuracion, async () => {
    let config = await prisma.configuracion.findFirst()

    // Si no existe, crear registro vacío con defaults
    if (!config) {
      config = await prisma.configuracion.create({
        data: {
          nombreSalon: "Mi Salón",
          moneda:      "MXN",
          zonaHoraria: "America/Mexico_City",
          anioFiscal:  new Date().getFullYear(),
        },
      })
    }

    return config
  })

  return NextResponse.json({ data })
}

// ── PUT /api/configuracion ────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!(await isAdmin(supabase, user.id)))
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })

  const parsed = configuracionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const { nombre_salon, moneda, anio_fiscal, telefono, email, direccion, zona_horaria } =
    parsed.data

  const existing = await prisma.configuracion.findFirst()

  const config = existing
    ? await prisma.configuracion.update({
        where: { id: existing.id },
        data: {
          nombreSalon:  nombre_salon,
          moneda,
          anioFiscal:   anio_fiscal,
          telefono:     telefono ?? null,
          email:        email    || null,
          direccion:    direccion ?? null,
          zonaHoraria:  zona_horaria ?? existing.zonaHoraria,
        },
      })
    : await prisma.configuracion.create({
        data: {
          nombreSalon:  nombre_salon,
          moneda,
          anioFiscal:   anio_fiscal,
          telefono:     telefono ?? null,
          email:        email    || null,
          direccion:    direccion ?? null,
          zonaHoraria:  zona_horaria ?? "America/Mexico_City",
        },
      })

  await invalidateCache(CACHE_KEYS.configuracion())

  return NextResponse.json({ data: config })
}
