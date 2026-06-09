"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Trash2 } from "lucide-react"
import { formatMXN } from "@/lib/utils/currency"

export interface CompraRow {
  id:             string
  fecha:          string | Date
  proveedor:      string | null
  cantidad:       string | number
  precioUnitario: string | number
  total:          string | number
  notas:          string | null
  producto:       { id: string; nombre: string; unidad: string }
}

function fmtFecha(v: string | Date): string {
  const d = v instanceof Date ? v : new Date(v)
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
}

export function getCompraColumns(
  onDelete: (id: string) => void,
): ColumnDef<CompraRow>[] {
  return [
    {
      accessorKey: "fecha",
      header: "Fecha",
      cell: ({ row }) => <span className="text-sm whitespace-nowrap">{fmtFecha(row.original.fecha)}</span>,
    },
    {
      id: "producto",
      header: "Producto",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.producto.nombre}</span>
      ),
    },
    {
      accessorKey: "proveedor",
      header: "Proveedor",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.proveedor ?? "—"}</span>
      ),
    },
    {
      accessorKey: "cantidad",
      header: () => <div className="text-right">Cantidad</div>,
      cell: ({ row }) => (
        <span className="text-sm text-right block">
          {Number(row.original.cantidad)} {row.original.producto.unidad}
        </span>
      ),
    },
    {
      accessorKey: "precioUnitario",
      header: () => <div className="text-right">C. unitario</div>,
      cell: ({ row }) => (
        <span className="text-sm text-right block">{formatMXN(Number(row.original.precioUnitario))}</span>
      ),
    },
    {
      accessorKey: "total",
      header: () => <div className="text-right">Total</div>,
      cell: ({ row }) => (
        <span className="text-sm font-medium text-right block">{formatMXN(Number(row.original.total))}</span>
      ),
    },
    {
      id: "acciones",
      header: () => null,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(row.original.id) }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}
