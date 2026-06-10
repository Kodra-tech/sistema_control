import { Badge } from "@/components/ui/badge"
import type { EstadoCita } from "@/lib/validations/cita"

const ESTADO_CONFIG: Record<EstadoCita, { label: string; className: string }> = {
  pendiente:  { label: "Pendiente",   className: "bg-amber-50  dark:bg-amber-900/30  text-amber-700  dark:text-amber-300  border-amber-200  dark:border-amber-700"  },
  confirmada: { label: "Confirmada",  className: "bg-blue-50   dark:bg-blue-900/30   text-blue-700   dark:text-blue-300   border-blue-200   dark:border-blue-700"   },
  realizada:  { label: "Realizada",   className: "bg-green-50  dark:bg-green-900/30  text-green-700  dark:text-green-300  border-green-200  dark:border-green-700"  },
  cancelada:  { label: "Cancelada",   className: "bg-red-50    dark:bg-red-900/30    text-red-700    dark:text-red-300    border-red-200    dark:border-red-700"    },
  no_asistio: { label: "No asistió",  className: "bg-zinc-100  dark:bg-zinc-800      text-zinc-500   dark:text-zinc-400   border-zinc-200   dark:border-zinc-700"   },
}

// Color para eventos del calendario (hex)
export const ESTADO_COLOR: Record<EstadoCita, string> = {
  pendiente:  "#f59e0b",
  confirmada: "#3b82f6",
  realizada:  "#22c55e",
  cancelada:  "#ef4444",
  no_asistio: "#9ca3af",
}

interface CitaEstadoBadgeProps {
  estado: string
}

export function CitaEstadoBadge({ estado }: CitaEstadoBadgeProps) {
  const cfg = ESTADO_CONFIG[estado as EstadoCita] ?? {
    label:     estado,
    className: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
  }
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  )
}
