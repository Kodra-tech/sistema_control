"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { formatMXN } from "@/lib/utils/currency"
import { GASTO_CATEGORIA_COLORES } from "@/lib/constants"

export interface GastoRow {
  id:          string
  concepto:    string
  monto:       string | number
  categoria:   string
  fecha:       string | Date
  comprobante: string | null
  notas:       string | null
}

function fmtFecha(v: string | Date): string {
  const d = v instanceof Date ? v : new Date(v)
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
}

export function getGastoColumns(
  onEdit:   (row: GastoRow) => void,
  onDelete: (id: string) => void,
): ColumnDef<GastoRow>[] {
  return [
    {
      accessorKey: "fecha",
      header: "Fecha",
      cell: ({ row }) => <span className="text-sm whitespace-nowrap">{fmtFecha(row.original.fecha)}</span>,
    },
    {
      accessorKey: "concepto",
      header: "Concepto",
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.concepto}</span>,
    },
    {
      accessorKey: "categoria",
      header: "Categoría",
      cell: ({ row }) => {
        const color = GASTO_CATEGORIA_COLORES[row.original.categoria] ?? "#9ca3af"
        return (
          <Badge
            variant="outline"
            style={{ color, borderColor: color, backgroundColor: `${color}18` }}
            className="text-xs"
          >
            {row.original.categoria}
          </Badge>
        )
      },
    },
    {
      accessorKey: "monto",
      header: "Monto",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-right block">
          {formatMXN(Number(row.original.monto))}
        </span>
      ),
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
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(row.original.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}
