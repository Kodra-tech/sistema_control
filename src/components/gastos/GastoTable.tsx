"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DataTable } from "@/components/shared/DataTable"
import { getGastoColumns, type GastoRow } from "@/components/gastos/GastoColumns"
import { GastoForm } from "@/components/gastos/GastoForm"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Download } from "lucide-react"
import { toast } from "sonner"
import { formatMXN } from "@/lib/utils/currency"
import { exportToCSV, fmtFechaCSV, fmtMontoCSV } from "@/lib/utils/export"
import { CATEGORIAS_GASTO } from "@/lib/constants"

interface GastoTableProps {
  gastos:      GastoRow[]
  total:       number
  totalGastos: number
  defaultMes:  number
  defaultAnio: number
}

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
]

export function GastoTable({ gastos, total, totalGastos, defaultMes, defaultAnio }: GastoTableProps) {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [formOpen,  setFormOpen]  = useState(false)
  const [selected,  setSelected]  = useState<GastoRow | null>(null)

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else        params.delete(key)
    startTransition(() => router.push(`/gastos?${params.toString()}`))
  }

  function handleMes(v: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("mes", v)
    startTransition(() => router.push(`/gastos?${params.toString()}`))
  }

  function handleAnio(v: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("anio", v)
    startTransition(() => router.push(`/gastos?${params.toString()}`))
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este gasto?")) return
    const res = await fetch(`/api/gastos/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Gasto eliminado")
      router.refresh()
    } else {
      toast.error("Error al eliminar")
    }
  }

  function handleExport() {
    exportToCSV(gastos, `gastos-${defaultAnio}-${String(defaultMes).padStart(2,"0")}`, [
      { key: "fecha",     header: "Fecha",      format: (v) => fmtFechaCSV(v as string | Date) },
      { key: "concepto",  header: "Concepto" },
      { key: "categoria", header: "Categoría" },
      { key: "monto",     header: "Monto",      format: (v) => fmtMontoCSV(v) },
      { key: "notas",     header: "Notas",      format: (v) => String(v ?? "") },
    ])
  }

  const anios   = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)
  const columns = getGastoColumns(
    (row) => { setSelected(row); setFormOpen(true) },
    handleDelete,
  )

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2 w-full">
      <Select value={String(defaultMes)} onValueChange={handleMes}>
        <SelectTrigger className="w-32 h-8 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          {MESES.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={String(defaultAnio)} onValueChange={handleAnio}>
        <SelectTrigger className="w-24 h-8 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          {anios.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select defaultValue="_" onValueChange={(v) => updateParam("categoria", v === "_" ? "" : v)}>
        <SelectTrigger className="w-44 h-8 text-sm"><SelectValue placeholder="Categoría" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="_">Todas</SelectItem>
          {CATEGORIAS_GASTO.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>

      <div className="ml-auto flex gap-2">
        <Button variant="outline" size="sm" className="h-8" onClick={handleExport}>
          <Download className="h-3.5 w-3.5 mr-1" /> CSV
        </Button>
        <Button size="sm" className="h-8" onClick={() => { setSelected(null); setFormOpen(true) }}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Nuevo
        </Button>
      </div>
    </div>
  )

  return (
    <>
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total gastos del período</p>
            <p className="text-2xl font-bold text-red-700">{formatMXN(totalGastos)}</p>
          </CardContent>
        </Card>

        <DataTable
          columns={columns}
          data={gastos}
          loading={isPending}
          pageSize={50}
          toolbar={toolbar}
        />

        <p className="text-xs text-muted-foreground">{total} gastos en el período</p>
      </div>

      <GastoForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => router.refresh()}
        defaultValues={selected}
      />
    </>
  )
}
