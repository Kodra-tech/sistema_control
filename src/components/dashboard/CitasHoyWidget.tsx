import Link from "next/link"
import { CalendarClock, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CitaEstadoBadge } from "@/components/citas/CitaEstadoBadge"

interface Cita {
  id:         string
  horaInicio: Date | string
  estado:     string
  cliente:    { nombre: string; apellido: string | null }
  servicio:   { nombre: string }
}

interface CitasHoyWidgetProps {
  citas: Cita[]
}

function fmtHora(h: Date | string): string {
  const d = h instanceof Date ? h : new Date(h)
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`
}

export function CitasHoyWidget({ citas }: CitasHoyWidgetProps) {
  const visible = citas.slice(0, 5)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="h-4 w-4" />
          Citas de hoy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Sin citas para hoy</p>
        ) : (
          visible.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 text-sm py-1.5 border-b last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-xs text-muted-foreground shrink-0">{fmtHora(c.horaInicio)}</span>
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {[c.cliente.nombre, c.cliente.apellido].filter(Boolean).join(" ")}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">{c.servicio.nombre}</p>
                </div>
              </div>
              <CitaEstadoBadge estado={c.estado} />
            </div>
          ))
        )}

        {citas.length > 5 && (
          <Button variant="ghost" size="sm" className="w-full mt-1" asChild>
            <Link href="/citas">
              Ver todas ({citas.length}) <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
