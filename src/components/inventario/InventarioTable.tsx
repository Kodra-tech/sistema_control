"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DataTable } from "@/components/shared/DataTable"
import { getInventarioColumns, type InventarioRow } from "@/components/inventario/InventarioColumns"
import { InventarioForm } from "@/components/inventario/InventarioForm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { CATEGORIAS_INVENTARIO } from "@/lib/constants"

interface InventarioTableProps {
  items:   InventarioRow[]
  total:   number
  defaultQ: string
  defaultActivo: boolean
}

export function InventarioTable({ items, total, defaultQ, defaultActivo }: InventarioTableProps) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [formOpen,  setFormOpen]  = useState(false)
  const [selected,  setSelected]  = useState<InventarioRow | null>(null)
  const [q,         setQ]         = useState(defaultQ)
  const debounceRef = useState<ReturnType<typeof setTimeout> | undefined>(undefined)

  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined) params.delete(k)
      else params.set(k, v)
    })
    startTransition(() => router.push(`/inventario?${params.toString()}`))
  }

  function handleSearch(val: string) {
    setQ(val)
    clearTimeout(debounceRef[0])
    ;(debounceRef as [ReturnType<typeof setTimeout> | undefined, unknown])[0] = setTimeout(() => {
      updateParams({ q: val || undefined })
    }, 300)
  }

  async function handleToggle(id: string, activo: boolean) {
    const res  = await fetch(`/api/inventario/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ activo: !activo }),
    })
    if (res.ok) {
      toast.success(activo ? "Producto desactivado" : "Producto activado")
      router.refresh()
    } else {
      toast.error("Error al actualizar")
    }
  }

  const columns = getInventarioColumns(
    (row) => { setSelected(row); setFormOpen(true) },
    handleToggle,
  )

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2 w-full">
      <Input
        className="h-8 w-48 text-sm"
        placeholder="Buscar producto…"
        value={q}
        onChange={(e) => handleSearch(e.target.value)}
      />
      <Select
        defaultValue={searchParams.get("categoria") ?? "_"}
        onValueChange={(v) => updateParams({ categoria: v === "_" ? undefined : v })}
      >
        <SelectTrigger className="h-8 w-36 text-sm"><SelectValue placeholder="Categoría" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="_">Todas</SelectItem>
          {CATEGORIAS_INVENTARIO.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-1.5">
        <Switch
          id="soloAlerta"
          checked={searchParams.get("alerta") === "true"}
          onCheckedChange={(v) => updateParams({ alerta: v ? "true" : undefined })}
        />
        <Label htmlFor="soloAlerta" className="text-sm cursor-pointer">Solo alertas</Label>
      </div>
      <div className="ml-auto">
        <Button size="sm" className="h-8" onClick={() => { setSelected(null); setFormOpen(true) }}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Nuevo
        </Button>
      </div>
    </div>
  )

  return (
    <>
      <DataTable
        columns={columns}
        data={items}
        loading={isPending}
        pageSize={50}
        toolbar={toolbar}
        rowClassName={(row: InventarioRow) =>
          Number(row.stockActual) <= Number(row.stockMinimo)
            ? cn("bg-red-50 hover:bg-red-100/70")
            : ""
        }
      />
      <p className="text-xs text-muted-foreground">{total} productos</p>

      <InventarioForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => router.refresh()}
        defaultValues={selected}
      />
    </>
  )
}
