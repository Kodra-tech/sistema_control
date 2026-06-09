"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, ToggleRight, AlertTriangle } from "lucide-react"
import { formatMXN } from "@/lib/utils/currency"

export interface InventarioRow {
  id:             string
  codigo:         string | null
  nombre:         string
  categoria:      string
  unidad:         string
  stockActual:    string | number
  stockMinimo:    string | number
  precioUnitario: string | number  // costo
  precioVenta:    string | number | null
  activo:         boolean
}

function calcMargen(row: InventarioRow): number | null {
  if (!row.precioVenta) return null
  const costo  = Number(row.precioUnitario)
  const venta  = Number(row.precioVenta)
  if (venta === 0) return null
  return ((venta - costo) / venta) * 100
}

export function getInventarioColumns(
  onEdit:   (row: InventarioRow) => void,
  onToggle: (id: string, activo: boolean) => void,
): ColumnDef<InventarioRow>[] {
  return [
    {
      accessorKey: "codigo",
      header: "Código",
      cell: ({ row }) => (
        <span className="text-xs font-mono text-muted-foreground">
          {row.original.codigo || row.original.id.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      accessorKey: "nombre",
      header: "Nombre",
      cell: ({ row }) => {
        const stockBajo = Number(row.original.stockActual) <= Number(row.original.stockMinimo)
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{row.original.nombre}</span>
            {stockBajo && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0 h-5">
                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> Stock bajo
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "categoria",
      header: "Categoría",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">{row.original.categoria}</Badge>
      ),
    },
    {
      accessorKey: "stockActual",
      header: "Stock",
      cell: ({ row }) => {
        const actual    = Number(row.original.stockActual)
        const minimo    = Number(row.original.stockMinimo)
        const stockBajo = actual <= minimo
        return (
          <span className={`text-sm font-medium text-right block ${stockBajo ? "text-red-700" : ""}`}>
            {actual} {row.original.unidad}
          </span>
        )
      },
    },
    {
      accessorKey: "stockMinimo",
      header: "Mín.",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground text-right block">
          {Number(row.original.stockMinimo)} {row.original.unidad}
        </span>
      ),
    },
    {
      accessorKey: "precioUnitario",
      header: "Costo",
      cell: ({ row }) => (
        <span className="text-sm text-right block">{formatMXN(Number(row.original.precioUnitario))}</span>
      ),
    },
    {
      accessorKey: "precioVenta",
      header: "P. venta",
      cell: ({ row }) => (
        <span className="text-sm text-right block">
          {row.original.precioVenta ? formatMXN(Number(row.original.precioVenta)) : "—"}
        </span>
      ),
    },
    {
      id: "margen",
      header: "Margen %",
      cell: ({ row }) => {
        const m = calcMargen(row.original)
        if (m === null) return <span className="text-muted-foreground text-sm">—</span>
        const cls = m >= 50 ? "text-green-700" : m >= 20 ? "text-amber-700" : "text-red-700"
        return <span className={`text-sm text-right block ${cls}`}>{m.toFixed(0)}%</span>
      },
    },
    {
      id: "acciones",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Pencil className="h-4 w-4 mr-2" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggle(row.original.id, row.original.activo)}>
              <ToggleRight className="h-4 w-4 mr-2" />
              {row.original.activo ? "Desactivar" : "Activar"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}
