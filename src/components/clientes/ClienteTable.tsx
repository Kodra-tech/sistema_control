"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { UserPlus } from "lucide-react"
import type { Cliente } from "@/generated/prisma/client"
import { DataTable } from "@/components/shared/DataTable"
import { ClienteForm } from "@/components/clientes/ClienteForm"
import { getClienteColumns } from "@/components/clientes/ClienteColumns"
import {
  softDeleteClienteAction,
  activateClienteAction,
  hardDeleteClienteAction,
} from "@/app/(dashboard)/clientes/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
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

interface ClienteTableProps {
  clientes:       Cliente[]
  total:          number
  defaultQ?:      string
  defaultActivo?: boolean
}

export function ClienteTable({
  clientes,
  total,
  defaultQ     = "",
  defaultActivo = true,
}: ClienteTableProps) {
  const router = useRouter()
  const [formOpen,     setFormOpen]     = useState(false)
  const [selected,     setSelected]     = useState<Cliente | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null)
  const [isPending,    startPending]    = useTransition()
  const searchTimer                     = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // ── URL-driven search (debounced 300 ms) ──────────────────────────────────
  function pushSearch(q: string, activo: boolean) {
    const params = new URLSearchParams()
    if (q)      params.set("q",     q)
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
  function openCreate() { setSelected(null); setFormOpen(true) }
  function openEdit(c: Cliente) { setSelected(c); setFormOpen(true) }

  // ── Desactivar (soft delete) ───────────────────────────────────────────────
  function handleDelete(cliente: Cliente) {
    const nombre = `${cliente.nombre} ${cliente.apellido ?? ""}`.trim()
    startPending(async () => {
      const result = await softDeleteClienteAction(cliente.id)
      result.error ? toast.error(result.error) : toast.success(`"${nombre}" desactivado`)
    })
  }

  // ── Activar ───────────────────────────────────────────────────────────────
  function handleActivate(cliente: Cliente) {
    const nombre = `${cliente.nombre} ${cliente.apellido ?? ""}`.trim()
    startPending(async () => {
      const result = await activateClienteAction(cliente.id)
      result.error ? toast.error(result.error) : toast.success(`"${nombre}" activado`)
    })
  }

  // ── Hard delete ───────────────────────────────────────────────────────────
  function handleHardDelete(cliente: Cliente) {
    setDeleteTarget(cliente)
  }

  function confirmHardDelete() {
    if (!deleteTarget) return
    const nombre = `${deleteTarget.nombre} ${deleteTarget.apellido ?? ""}`.trim()
    const id = deleteTarget.id
    setDeleteTarget(null)
    startPending(async () => {
      const result = await hardDeleteClienteAction(id)
      result.error ? toast.error(result.error) : toast.success(`"${nombre}" eliminado permanentemente`)
    })
  }

  const columns = useMemo(
    () => getClienteColumns({
      onEdit:       openEdit,
      onDelete:     handleDelete,
      onActivate:   handleActivate,
      onHardDelete: handleHardDelete,
    }),
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
          <Button onClick={openCreate} disabled={isPending}>
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
                  disabled={isPending}
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

      {/* AlertDialog: confirmar eliminación permanente */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará a{" "}
              <strong>
                {deleteTarget
                  ? `${deleteTarget.nombre} ${deleteTarget.apellido ?? ""}`.trim()
                  : ""}
              </strong>{" "}
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
