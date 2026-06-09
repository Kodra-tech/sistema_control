"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { invalidateCache, CACHE_KEYS } from "@/lib/cache"
import { clienteSchema, clienteUpdateSchema } from "@/lib/validations/clientes"
import type { ClienteInput, ClienteUpdateInput } from "@/lib/validations/clientes"

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  return user
}

export async function createClienteAction(
  data: ClienteInput,
): Promise<{ error?: string }> {
  await requireAuth()

  const parsed = clienteSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.nombre?.[0] ?? "Datos inválidos" }
  }

  const { nombre, apellido, telefono, email, notas } = parsed.data

  await prisma.cliente.create({
    data: {
      nombre,
      apellido: apellido  ?? null,
      telefono: telefono  || null,
      email:    email     || null,
      notas:    notas     ?? null,
    },
  })

  await invalidateCache(CACHE_KEYS.clientes(true), CACHE_KEYS.clientes(false))
  revalidatePath("/clientes")
  return {}
}

export async function updateClienteAction(
  id: string,
  data: ClienteUpdateInput,
): Promise<{ error?: string }> {
  await requireAuth()

  const parsed = clienteUpdateSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos" }

  const { nombre, apellido, telefono, email, notas } = parsed.data

  await prisma.cliente.update({
    where: { id },
    data: {
      ...(nombre   !== undefined && { nombre }),
      ...(apellido !== undefined && { apellido: apellido ?? null }),
      ...(telefono !== undefined && { telefono: telefono || null }),
      ...(email    !== undefined && { email:    email    || null }),
      ...(notas    !== undefined && { notas:    notas    ?? null }),
    },
  })

  await invalidateCache(
    CACHE_KEYS.clientes(true),
    CACHE_KEYS.clientes(false),
    CACHE_KEYS.cliente(id),
  )
  revalidatePath("/clientes")
  return {}
}

export async function softDeleteClienteAction(id: string): Promise<{ error?: string }> {
  await requireAuth()

  const existing = await prisma.cliente.findUnique({ where: { id } })
  if (!existing)        return { error: "Cliente no encontrado" }
  if (!existing.activo) return { error: "El cliente ya está inactivo" }

  await prisma.cliente.update({ where: { id }, data: { activo: false } })

  await invalidateCache(
    CACHE_KEYS.clientes(true),
    CACHE_KEYS.clientes(false),
    CACHE_KEYS.cliente(id),
  )
  revalidatePath("/clientes")
  return {}
}

export async function activateClienteAction(id: string): Promise<{ error?: string }> {
  await requireAuth()

  const existing = await prisma.cliente.findUnique({ where: { id } })
  if (!existing)       return { error: "Cliente no encontrado" }
  if (existing.activo) return { error: "El cliente ya está activo" }

  await prisma.cliente.update({ where: { id }, data: { activo: true } })

  await invalidateCache(
    CACHE_KEYS.clientes(true),
    CACHE_KEYS.clientes(false),
    CACHE_KEYS.cliente(id),
  )
  revalidatePath("/clientes")
  return {}
}

export async function hardDeleteClienteAction(id: string): Promise<{ error?: string }> {
  await requireAuth()

  const existing = await prisma.cliente.findUnique({ where: { id } })
  if (!existing) return { error: "Cliente no encontrado" }

  await prisma.cliente.delete({ where: { id } })

  await invalidateCache(
    CACHE_KEYS.clientes(true),
    CACHE_KEYS.clientes(false),
    CACHE_KEYS.cliente(id),
  )
  revalidatePath("/clientes")
  return {}
}
