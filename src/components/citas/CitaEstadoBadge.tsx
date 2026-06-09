import { Badge } from "@/components/ui/badge"
import type { EstadoCita } from "@/lib/validations/cita"

const ESTADO_CONFIG: Record<EstadoCita, { label: string; className: string }> = {
  pendiente:  { label: "Pendiente",   className: "bg-amber-50  text-amber-700  border-amber-200"  },
  confirmada: { label: "Confirmada",  className: "bg-blue-50   text-blue-700   border-blue-200"   },
  realizada:  { label: "Realizada",   className: "bg-green-50  text-green-700  border-green-200"  },
  cancelada:  { label: "Cancelada",   className: "bg-red-50    text-red-700    border-red-200"    },
  no_asistio: { label: "No asistió",  className: "bg-zinc-100  text-zinc-500   border-zinc-200"   },
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
    className: "bg-zinc-100 text-zinc-600 border-zinc-200",
  }
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  )
}
