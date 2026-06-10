"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DataTable } from "@/components/shared/DataTable"
import { getInventarioColumns, type InventarioRow } from "@/components/inventario/InventarioColumns"
import { InventarioForm } from "@/components/inventario/InventarioForm"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  items:         InventarioRow[]
  total:         number
  defaultQ:      string
  defaultActivo: boolean
}

export function InventarioTable({ items, total, defaultQ, defaultActivo }: InventarioTableProps) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [formOpen,     setFormOpen]     = useState(false)
  const [selected,     setSelected]     = useState<InventarioRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<InventarioRow | null>(null)
  const [q,            setQ]            = useState(defaultQ)
  const [showInactive, setShowInactive] = useState(!defaultActivo)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

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
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateParams({ q: val || undefined, page: undefined })
    }, 300)
  }

  function handleToggleInactive(checked: boolean) {
    setShowInactive(checked)
    updateParams({ activo: checked ? "false" : undefined, alerta: undefined, page: undefined })
  }

  // ── Acciones ──────────────────────────────────────────────────────────────

  async function handleDesactivar(row: InventarioRow) {
    const res = await fetch(`/api/inventario/${row.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ activo: false }),
    })
    if (res.ok) {
      toast.success(`"${row.nombre}" desactivado`)
      router.refresh()
    } else {
      toast.error("Error al desactivar")
    }
  }

  async function handleActivar(row: InventarioRow) {
    const res = await fetch(`/api/inventario/${row.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ activo: true }),
    })
    if (res.ok) {
      toast.success(`"${row.nombre}" activado`)
      router.refresh()
    } else {
      toast.error("Error al activar")
    }
  }

  function handleHardDelete(row: InventarioRow) {
    setDeleteTarget(row)
  }

  async function confirmHardDelete() {
    if (!deleteTarget) return
    const { id, nombre } = deleteTarget
    setDeleteTarget(null)
    const res = await fetch(`/api/inventario/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success(`"${nombre}" eliminado permanentemente`)
      router.refresh()
    } else {
      toast.error("Error al eliminar")
    }
  }

  const columns = getInventarioColumns({
    onEdit:       (row) => { setSelected(row); setFormOpen(true) },
    onDesactivar: handleDesactivar,
    onActivar:    handleActivar,
    onHardDelete: handleHardDelete,
  })

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
      {!showInactive && (
        <div className="flex items-center gap-1.5">
          <Switch
            id="soloAlerta"
            checked={searchParams.get("alerta") === "true"}
            onCheckedChange={(v) => updateParams({ alerta: v ? "true" : undefined })}
          />
          <Label htmlFor="soloAlerta" className="text-sm cursor-pointer">Solo alertas</Label>
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <Switch
          id="inactivos"
          checked={showInactive}
          onCheckedChange={handleToggleInactive}
        />
        <Label htmlFor="inactivos" className="text-sm cursor-pointer">Ver inactivos</Label>
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
          !showInactive && Number(row.stockActual) <= Number(row.stockMinimo)
            ? cn("bg-red-50 dark:bg-red-950/40 hover:bg-red-100/70 dark:hover:bg-red-900/40")
            : ""
        }
      />
      <p className="text-xs text-muted-foreground">
        {total} {showInactive ? "inactivo(s)" : "activo(s)"}
      </p>

      <InventarioForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => { setFormOpen(false); router.refresh() }}
        defaultValues={selected}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará{" "}
              <strong>{deleteTarget?.nombre}</strong>{" "}
              y todos sus datos de forma permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmHardDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
