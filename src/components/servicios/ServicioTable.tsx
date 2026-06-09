"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import type { Servicio } from "@/generated/prisma/client"
import { DataTable } from "@/components/shared/DataTable"
import { ServicioForm } from "@/components/servicios/ServicioForm"
import { getServicioColumns } from "@/components/servicios/ServicioColumns"
import { toggleServicioAction } from "@/app/(dashboard)/servicios/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { CATEGORIAS_SERVICIO } from "@/lib/validations/servicios"

interface Props {
  servicios:     Servicio[]
  total:         number
  defaultQ?:     string
  defaultActivo?: boolean
  defaultCat?:   string
}

export function ServicioTable({
  servicios, total, defaultQ = "", defaultActivo = true, defaultCat = "",
}: Props) {
  const router = useRouter()
  const [formOpen,  setFormOpen]  = useState(false)
  const [selected,  setSelected]  = useState<Servicio | null>(null)
  const [isToggling, startToggle] = useTransition()
  const [showInactive, setShowInactive] = useState(!defaultActivo)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function pushSearch(q: string, activo: boolean, cat: string) {
    const p = new URLSearchParams()
    if (q)     p.set("q",        q)
    if (!activo) p.set("activo",  "false")
    if (cat)   p.set("categoria", cat)
    router.push(`/servicios?${p.toString()}`)
  }

  function handleSearch(v: string) {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() =>
      pushSearch(v, !showInactive, defaultCat), 300)
  }

  function handleToggleInactive(checked: boolean) {
    setShowInactive(checked)
    pushSearch(defaultQ, !checked, defaultCat)
  }

  function handleCategoriaChange(cat: string) {
    pushSearch(defaultQ, !showInactive, cat === "todas" ? "" : cat)
  }

  function openEdit(s: Servicio) { setSelected(s); setFormOpen(true) }
  function openCreate()          { setSelected(null); setFormOpen(true) }

  function handleToggle(s: Servicio) {
    const msg = s.activo
      ? `¿Desactivar "${s.nombre}"?`
      : `¿Activar "${s.nombre}"?`
    if (!confirm(msg)) return
    startToggle(async () => {
      const result = await toggleServicioAction(s.id, !s.activo)
      result.error
        ? toast.error(result.error)
        : toast.success(s.activo ? "Servicio desactivado" : "Servicio activado")
    })
  }

  const columns = useMemo(
    () => getServicioColumns({ onEdit: openEdit, onToggle: handleToggle }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Servicios</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {total} {showInactive ? "inactivo(s)" : "activo(s)"}
            </p>
          </div>
          <Button onClick={openCreate} disabled={isToggling}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo servicio
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={servicios}
          pageSize={20}
          onRowClick={openEdit}
          toolbar={
            <>
              <Input
                placeholder="Buscar servicio…"
                defaultValue={defaultQ}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-8 w-60"
              />
              <Select
                value={defaultCat || "todas"}
                onValueChange={handleCategoriaChange}
              >
                <SelectTrigger className="h-8 w-40">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {CATEGORIAS_SERVICIO.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 ml-auto">
                <Switch
                  id="inactivos-svc"
                  checked={showInactive}
                  onCheckedChange={handleToggleInactive}
                  disabled={isToggling}
                />
                <Label htmlFor="inactivos-svc" className="text-sm cursor-pointer select-none">
                  Ver inactivos
                </Label>
              </div>
            </>
          }
        />
      </div>

      <ServicioForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        defaultValues={selected}
        onSuccess={() => setFormOpen(false)}
      />
    </>
  )
}
