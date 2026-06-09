"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, UserX, UserCheck, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Cliente } from "@/generated/prisma/client"
import { formatShortDate } from "@/lib/utils/dates"

interface Actions {
  onEdit:       (cliente: Cliente) => void
  onDelete:     (cliente: Cliente) => void
  onActivate:   (cliente: Cliente) => void
  onHardDelete: (cliente: Cliente) => void
}

export function getClienteColumns(actions: Actions): ColumnDef<Cliente>[] {
  return [
    {
      id: "nombre_completo",
      header: "Nombre completo",
      accessorFn: (row) => `${row.nombre} ${row.apellido ?? ""}`.trim(),
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: "telefono",
      header: "Teléfono",
      cell: ({ row }) =>
        row.original.telefono ? (
          <a
            href={`tel:${row.original.telefono}`}
            className="hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.original.telefono}
          </a>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) =>
        row.original.email ? (
          <a
            href={`mailto:${row.original.email}`}
            className="hover:underline truncate max-w-[180px] block"
            onClick={(e) => e.stopPropagation()}
          >
            {row.original.email}
          </a>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    {
      id: "fecha_registro",
      header: "Registro",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm tabular-nums">
          {formatShortDate(row.original.createdAt)}
        </span>
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
        const cliente = row.original
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
                <span className="sr-only">Abrir acciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); actions.onEdit(cliente) }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {cliente.activo ? (
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); actions.onDelete(cliente) }}
                  className="text-destructive focus:text-destructive"
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Desactivar
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); actions.onActivate(cliente) }}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Activar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); actions.onHardDelete(cliente) }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar permanentemente
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
