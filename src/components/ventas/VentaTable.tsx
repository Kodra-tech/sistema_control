"use client"

import { useCallback, useRef, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DataTable } from "@/components/shared/DataTable"
import { ventaColumns, type VentaRow } from "@/components/ventas/VentaColumns"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Download } from "lucide-react"
import { formatMXN } from "@/lib/utils/currency"
import { exportToCSV, fmtFechaCSV, fmtMontoCSV } from "@/lib/utils/export"
import { METODOS_PAGO } from "@/lib/constants"

interface ResumenVentas {
  ventas:   number
  subtotal: number
  utilidad: number
}

interface VentaTableProps {
  ventas:    VentaRow[]
  total:     number
  resumen:   ResumenVentas
  defaultMes:  number
  defaultAnio: number
}

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
]

export function VentaTable({ ventas, total, resumen, defaultMes, defaultAnio }: VentaTableProps) {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [tipo, setTipo]     = useState(searchParams.get("tipo")        ?? "")
  const [metodo, setMetodo] = useState(searchParams.get("metodo_pago") ?? "")

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else        params.delete(key)
    startTransition(() => router.push(`/ventas?${params.toString()}`))
  }

  function handleMes(v: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("mes", v)
    startTransition(() => router.push(`/ventas?${params.toString()}`))
  }

  function handleAnio(v: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("anio", v)
    startTransition(() => router.push(`/ventas?${params.toString()}`))
  }

  function handleExport() {
    exportToCSV(ventas, `ventas-${defaultAnio}-${String(defaultMes).padStart(2,"0")}`, [
      { key: "fecha",     header: "Fecha",      format: (v) => fmtFechaCSV(v as string | Date) },
      { key: "concepto",  header: "Concepto",   format: (v) => String(v ?? "") },
      { key: "tipo",      header: "Tipo" },
      { key: "cantidad",  header: "Cantidad",   format: (v) => String(v) },
      { key: "total",     header: "Total",      format: (v) => fmtMontoCSV(v) },
      { key: "metodoPago",header: "Método pago" },
    ])
  }

  const anios = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2 w-full">
      {/* Selector mes/año */}
      <Select value={String(defaultMes)} onValueChange={handleMes}>
        <SelectTrigger className="w-32 h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MESES.map((m, i) => (
            <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={String(defaultAnio)} onValueChange={handleAnio}>
        <SelectTrigger className="w-24 h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {anios.map((a) => (
            <SelectItem key={a} value={String(a)}>{a}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filtros */}
      <Select value={tipo || "_"} onValueChange={(v) => { setTipo(v === "_" ? "" : v); updateParam("tipo", v === "_" ? "" : v) }}>
        <SelectTrigger className="w-32 h-8 text-sm">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_">Todos</SelectItem>
          <SelectItem value="servicio">Servicio</SelectItem>
          <SelectItem value="producto">Producto</SelectItem>
        </SelectContent>
      </Select>

      <Select value={metodo || "_"} onValueChange={(v) => { setMetodo(v === "_" ? "" : v); updateParam("metodo_pago", v === "_" ? "" : v) }}>
        <SelectTrigger className="w-36 h-8 text-sm">
          <SelectValue placeholder="Método pago" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_">Todos</SelectItem>
          {METODOS_PAGO.map((m) => (
            <SelectItem key={m.value} value={m.value}>{m.icon} {m.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="ml-auto flex gap-2">
        <Button variant="outline" size="sm" className="h-8" onClick={handleExport}>
          <Download className="h-3.5 w-3.5 mr-1" />
          CSV
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Totales */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Ingresos",  value: resumen.ventas,   color: "text-foreground" },
          { label: "Costo",     value: resumen.ventas - resumen.utilidad, color: "text-muted-foreground" },
          { label: "Utilidad",  value: resumen.utilidad, color: "text-green-700" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={`text-lg font-bold ${item.color}`}>{formatMXN(item.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <DataTable
        columns={ventaColumns}
        data={ventas}
        loading={isPending}
        pageSize={50}
        toolbar={toolbar}
      />

      <p className="text-xs text-muted-foreground">{total} registros en el período</p>
    </div>
  )
}
