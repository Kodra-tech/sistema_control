"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { invalidateCache, CACHE_KEYS } from "@/lib/cache"
import { servicioSchema, servicioUpdateSchema } from "@/lib/validations/servicios"
import type { ServicioInput, ServicioUpdateInput } from "@/lib/validations/servicios"

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  return user
}

export async function createServicioAction(data: ServicioInput): Promise<{ error?: string }> {
  await requireAuth()

  const parsed = servicioSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos" }

  const { nombre, descripcion, precio, costo, duracion_minutos, categoria, activo } = parsed.data

  await prisma.servicio.create({
    data: {
      nombre,
      descripcion:     descripcion ?? null,
      precio,
      costo:           costo       ?? null,
      duracionMinutos: duracion_minutos,
      categoria:       categoria   ?? null,
      activo,
    },
  })

  await invalidateCache(CACHE_KEYS.servicios())
  revalidatePath("/servicios")
  return {}
}

export async function updateServicioAction(
  id: string,
  data: ServicioUpdateInput,
): Promise<{ error?: string }> {
  await requireAuth()

  const parsed = servicioUpdateSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos" }

  const { nombre, descripcion, precio, costo, duracion_minutos, categoria, activo } = parsed.data

  await prisma.servicio.update({
    where: { id },
    data: {
      ...(nombre           !== undefined && { nombre }),
      ...(descripcion      !== undefined && { descripcion:     descripcion ?? null }),
      ...(precio           !== undefined && { precio }),
      ...(costo            !== undefined && { costo:           costo       ?? null }),
      ...(duracion_minutos !== undefined && { duracionMinutos: duracion_minutos }),
      ...(categoria        !== undefined && { categoria:       categoria   ?? null }),
      ...(activo           !== undefined && { activo }),
    },
  })

  await invalidateCache(CACHE_KEYS.servicios(), CACHE_KEYS.servicio(id))
  revalidatePath("/servicios")
  return {}
}

export async function toggleServicioAction(id: string, activo: boolean): Promise<{ error?: string }> {
  await requireAuth()
  await prisma.servicio.update({ where: { id }, data: { activo } })
  await invalidateCache(CACHE_KEYS.servicios(), CACHE_KEYS.servicio(id))
  revalidatePath("/servicios")
  return {}
}
