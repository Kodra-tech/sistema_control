"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { UserPlus } from "lucide-react"
import type { Cliente } from "@/generated/prisma/client"
import { DataTable } from "@/components/shared/DataTable"
import { ClienteForm } from "@/components/clientes/ClienteForm"
import { getClienteColumns } from "@/components/clientes/ClienteColumns"
import { softDeleteClienteAction } from "@/app/(dashboard)/clientes/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface ClienteTableProps {
  clientes:      Cliente[]
  total:         number
  defaultQ?:     string
  defaultActivo?: boolean
}

export function ClienteTable({
  clientes,
  total,
  defaultQ     = "",
  defaultActivo = true,
}: ClienteTableProps) {
  const router = useRouter()
  const [formOpen,  setFormOpen]  = useState(false)
  const [selected,  setSelected]  = useState<Cliente | null>(null)
  const [isDeleting, startDelete] = useTransition()
  const searchTimer               = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // ── URL-driven search (debounced 300 ms) ──────────────────────────────────
  function pushSearch(q: string, activo: boolean) {
    const params = new URLSearchParams()
    if (q)     params.set("q",     q)
    if (!activo) params.set("activo", "false")
    router.push(`/clientes?${params.toString()}`)
  }

  function handleSearch(value: string) {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      pushSearch(value, !showInactive)
    }, 300)
  }

  const [showInactive, setShowInactive] = useState(!defaultActivo)

  function handleToggleInactive(checked: boolean) {
    setShowInactive(checked)
    pushSearch(defaultQ, !checked)
  }

  // ── Sheet ─────────────────────────────────────────────────────────────────
  function openCreate() { setSelected(null);    setFormOpen(true) }
  function openEdit(c: Cliente) { setSelected(c); setFormOpen(true) }

  // ── Soft delete ───────────────────────────────────────────────────────────
  function handleDelete(cliente: Cliente) {
    const nombre = `${cliente.nombre} ${cliente.apellido ?? ""}`.trim()
    if (!confirm(`¿Desactivar a "${nombre}"?`)) return
    startDelete(async () => {
      const result = await softDeleteClienteAction(cliente.id)
      result.error ? toast.error(result.error) : toast.success(`"${nombre}" desactivado`)
    })
  }

  const columns = useMemo(
    () => getClienteColumns({ onEdit: openEdit, onDelete: handleDelete }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return (
    <>
      <div className="space-y-5">
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Clientes</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {total} {showInactive ? "inactivo(s)" : "activo(s)"}
            </p>
          </div>
          <Button onClick={openCreate} disabled={isDeleting}>
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo cliente
          </Button>
        </div>

        {/* Tabla */}
        <DataTable
          columns={columns}
          data={clientes}
          onRowClick={openEdit}
          toolbar={
            <>
              <Input
                placeholder="Buscar por nombre o teléfono…"
                defaultValue={defaultQ}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-8 w-72"
              />
              <div className="flex items-center gap-2 ml-auto">
                <Switch
                  id="inactivos"
                  checked={showInactive}
                  onCheckedChange={handleToggleInactive}
                  disabled={isDeleting}
                />
                <Label htmlFor="inactivos" className="text-sm cursor-pointer select-none">
                  Ver inactivos
                </Label>
              </div>
            </>
          }
        />
      </div>

      {/* Sheet crear / editar */}
      <ClienteForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        defaultValues={selected}
        onSuccess={() => setFormOpen(false)}
      />
    </>
  )
}
