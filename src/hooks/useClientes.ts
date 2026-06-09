"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import type { Cliente } from "@/generated/prisma/client"
import type { ClienteInput, ClienteUpdateInput } from "@/lib/validations/clientes"

interface UseClientesOptions {
  activo?: boolean
  q?: string
}

export function useClientes({ activo = true, q = "" }: UseClientesOptions = {}) {
  const [clientes, setClientes]   = useState<Cliente[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ activo: String(activo) })
      if (q) params.set("q", q)
      const res = await fetch(`/api/clientes?${params.toString()}`)
      if (!res.ok) throw new Error()
      const { data } = await res.json()
      setClientes(data?.items ?? [])
      setTotal(data?.total   ?? 0)
    } catch {
      toast.error("Error al cargar clientes")
    } finally {
      setLoading(false)
    }
  }, [activo, q])

  useEffect(() => { load() }, [load])

  const create = async (input: ClienteInput): Promise<Cliente> => {
    const res = await fetch("/api/clientes", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(input),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? "Error al crear cliente")
    }
    const { data } = await res.json()
    await load()
    return data
  }

  const update = async (id: string, input: ClienteUpdateInput): Promise<Cliente> => {
    const res = await fetch(`/api/clientes/${id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(input),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? "Error al actualizar cliente")
    }
    const { data } = await res.json()
    await load()
    return data
  }

  const remove = async (id: string): Promise<void> => {
    const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? "Error al desactivar cliente")
    }
    await load()
  }

  return { clientes, total, loading, refresh: load, create, update, remove }
}
