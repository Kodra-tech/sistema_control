"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, ToggleLeft, ToggleRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Servicio } from "@/generated/prisma/client"
import { formatMXN } from "@/lib/utils/currency"

interface Actions {
  onEdit:   (s: Servicio) => void
  onToggle: (s: Servicio) => void
}

function MargenCell({ precio, costo }: { precio: unknown; costo: unknown }) {
  const p = Number(precio)
  const c = Number(costo)
  if (!costo || c <= 0 || p <= 0) {
    return <span className="text-muted-foreground text-xs">—</span>
  }
  const pct = ((p - c) / p) * 100
  const cls =
    pct > 50  ? "text-green-700 bg-green-50 border-green-200" :
    pct >= 20 ? "text-amber-700 bg-amber-50 border-amber-200" :
                "text-red-700   bg-red-50   border-red-200"
  return (
    <Badge variant="outline" className={cls}>
      {pct.toFixed(0)}%
    </Badge>
  )
}

export function getServicioColumns(actions: Actions): ColumnDef<Servicio>[] {
  return [
    {
      accessorKey: "nombre",
      header: "Servicio",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.nombre}</p>
          {row.original.descripcion && (
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {row.original.descripcion}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "categoria",
      header: "Categoría",
      cell: ({ row }) =>
        row.original.categoria ? (
          <Badge variant="secondary">{row.original.categoria}</Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    {
      accessorKey: "precio",
      header: "Precio",
      cell: ({ row }) => (
        <span className="tabular-nums font-medium">
          {formatMXN(Number(row.original.precio))}
        </span>
      ),
    },
    {
      accessorKey: "costo",
      header: "Costo",
      cell: ({ row }) =>
        row.original.costo != null ? (
          <span className="tabular-nums text-muted-foreground">
            {formatMXN(Number(row.original.costo))}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    {
      id: "margen",
      header: "Margen",
      cell: ({ row }) => (
        <MargenCell precio={row.original.precio} costo={row.original.costo} />
      ),
    },
    {
      id: "estado",
      header: "Estado",
      cell: ({ row }) =>
        row.original.activo ? (
          <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
            Activo
          </Badge>
        ) : (
          <Badge variant="secondary">Inactivo</Badge>
        ),
    },
    {
      id: "acciones",
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => {
        const s = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Acciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onEdit(s)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => actions.onToggle(s)}>
                {s.activo ? (
                  <><ToggleLeft  className="mr-2 h-4 w-4 text-destructive" />Desactivar</>
                ) : (
                  <><ToggleRight className="mr-2 h-4 w-4 text-green-600"   />Activar</>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
