"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { formatMXN } from "@/lib/utils/currency"

export interface VentaRow {
  id:             string
  fecha:          string | Date
  concepto:       string | null
  tipo:           string
  cantidad:       number
  precioUnitario: string | number | null
  costoUnitario:  string | number | null
  subtotal:       string | number
  descuento:      string | number
  total:          string | number
  metodoPago:     string
  notas:          string | null
  cliente:        { id: string; nombre: string; apellido: string | null } | null
}

const METODO_LABEL: Record<string, string> = {
  efectivo:      "Efectivo",
  tarjeta:       "Tarjeta",
  transferencia: "Transferencia",
  otro:          "Otro",
}

const METODO_COLOR: Record<string, string> = {
  efectivo:      "bg-green-50  text-green-700  border-green-200",
  tarjeta:       "bg-blue-50   text-blue-700   border-blue-200",
  transferencia: "bg-violet-50 text-violet-700 border-violet-200",
  otro:          "bg-zinc-100  text-zinc-600   border-zinc-200",
}

function calcUtilidad(row: VentaRow) {
  if (!row.precioUnitario || !row.costoUnitario) return null
  return (Number(row.precioUnitario) - Number(row.costoUnitario)) * row.cantidad
}

function fmtFecha(v: string | Date): string {
  const d = v instanceof Date ? v : new Date(v)
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
}

export const ventaColumns: ColumnDef<VentaRow>[] = [
  {
    accessorKey: "fecha",
    header: "Fecha",
    cell: ({ row }) => <span className="whitespace-nowrap text-sm">{fmtFecha(row.original.fecha)}</span>,
  },
  {
    accessorKey: "concepto",
    header: "Concepto",
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-sm">{row.original.concepto ?? "—"}</p>
        {row.original.tipo === "producto" && (
          <span className="text-xs text-muted-foreground">Producto · x{row.original.cantidad}</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "cliente",
    header: "Cliente",
    cell: ({ row }) => {
      const c = row.original.cliente
      if (!c) return <span className="text-muted-foreground text-sm">—</span>
      return <span className="text-sm">{[c.nombre, c.apellido].filter(Boolean).join(" ")}</span>
    },
  },
  {
    accessorKey: "metodoPago",
    header: "Método",
    cell: ({ row }) => {
      const m = row.original.metodoPago
      return (
        <Badge variant="outline" className={`text-xs ${METODO_COLOR[m] ?? ""}`}>
          {METODO_LABEL[m] ?? m}
        </Badge>
      )
    },
  },
  {
    accessorKey: "cantidad",
    header: "Cant.",
    cell: ({ row }) => <span className="text-sm text-right block">{row.original.cantidad}</span>,
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => (
      <span className="text-sm font-medium text-right block">
        {formatMXN(Number(row.original.total))}
      </span>
    ),
  },
  {
    id: "utilidad",
    header: "Utilidad $",
    cell: ({ row }) => {
      const u = calcUtilidad(row.original)
      if (u === null) return <span className="text-muted-foreground text-sm">—</span>
      return (
        <span className={`text-sm text-right block font-medium ${u >= 0 ? "text-green-700" : "text-red-700"}`}>
          {formatMXN(u)}
        </span>
      )
    },
  },
  {
    id: "margen",
    header: "Margen %",
    cell: ({ row }) => {
      const u   = calcUtilidad(row.original)
      const sub = Number(row.original.subtotal)
      if (u === null || sub === 0) return <span className="text-muted-foreground text-sm">—</span>
      const pct = (u / sub) * 100
      const cls = pct >= 50 ? "text-green-700" : pct >= 20 ? "text-amber-700" : "text-red-700"
      return <span className={`text-sm text-right block ${cls}`}>{pct.toFixed(0)}%</span>
    },
  },
]
