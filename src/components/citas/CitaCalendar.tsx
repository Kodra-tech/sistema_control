"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin, { type DateClickArg } from "@fullcalendar/interaction"
import type { EventClickArg, EventDropArg, EventInput, ToolbarInput } from "@fullcalendar/core"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Wifi, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { CitaEstadoBadge, ESTADO_COLOR } from "@/components/citas/CitaEstadoBadge"
import { ConvertirCitaModal } from "@/components/citas/ConvertirCitaModal"
import { CitaForm } from "@/components/citas/CitaForm"
import type { EstadoCita } from "@/lib/validations/cita"
import { TRANSICIONES_ESTADO } from "@/lib/validations/cita"
import { formatMXN } from "@/lib/utils/currency"

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface CitaEvento {
  id:         string
  fecha:      string      // ISO date from JSON response
  horaInicio: string      // ISO datetime (Time field serialized)
  horaFin:    string | null
  estado:     string
  notas:      string | null
  ventaId:    string | null
  cliente:    { id: string; nombre: string; apellido: string | null; telefono: string | null }
  servicio:   { id: string; nombre: string; precio: number | string; duracionMinutos: number }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function citaToEvent(c: CitaEvento): EventInput {
  const color    = ESTADO_COLOR[c.estado as EstadoCita] ?? "#9ca3af"
  const fechaStr = String(c.fecha).split("T")[0]

  // horaInicio viene como "1970-01-01T08:00:00.000Z" (Time field from Prisma serializado a JSON)
  const horaStr    = String(c.horaInicio).slice(11, 16)
  const horaFinStr = c.horaFin ? String(c.horaFin).slice(11, 16) : undefined

  return {
    id:              c.id,
    title:           `${c.cliente.nombre} — ${c.servicio.nombre}`,
    start:           `${fechaStr}T${horaStr}`,
    end:             horaFinStr ? `${fechaStr}T${horaFinStr}` : undefined,
    backgroundColor: color,
    borderColor:     color,
    extendedProps:   c,
  }
}

// ── Componente ─────────────────────────────────────────────────────────────────

export default function CitaCalendar() {
  const [eventos,         setEventos]         = useState<EventInput[]>([])
  const [selectedCita,   setSelectedCita]    = useState<CitaEvento | null>(null)
  const [detailOpen,     setDetailOpen]       = useState(false)
  const [convertirOpen,  setConvertirOpen]    = useState(false)
  const [formOpen,       setFormOpen]         = useState(false)
  const [formFecha,      setFormFecha]        = useState<Date | undefined>()
  const [formHora,       setFormHora]         = useState<string | undefined>()
  const [realtimeActive, setRealtimeActive]   = useState(false)
  const [fetching,       setFetching]         = useState(false)
  const currentRangeRef = useRef<{ start: string; end: string } | null>(null)
  const calendarRef     = useRef<FullCalendar>(null)

  // Detectar móvil sincrónicamente para evitar flash de la vista incorrecta
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  )

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
      calendarRef.current?.getApi().changeView(e.matches ? "timeGridDay" : "timeGridWeek")
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const fetchCitas = useCallback(async (start?: string, end?: string) => {
    const s = start ?? currentRangeRef.current?.start
    const e = end   ?? currentRangeRef.current?.end
    if (!s || !e) return
    setFetching(true)
    try {
      const res  = await fetch(`/api/citas?fecha_desde=${s}&fecha_hasta=${e}`)
      if (!res.ok) return
      const data = await res.json()
      const items: CitaEvento[] = data.data?.items ?? []
      setEventos(items.map(citaToEvent))
    } catch {
      // silencioso
    } finally {
      setFetching(false)
    }
  }, [])

  // Supabase Realtime
  useEffect(() => {
    const supabase = createClient()
    const channel  = supabase
      .channel("citas-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "citas" }, () => {
        fetchCitas()
      })
      .subscribe((status) => {
        setRealtimeActive(status === "SUBSCRIBED")
      })
    return () => { supabase.removeChannel(channel) }
  }, [fetchCitas])

  function handleDateClick(arg: DateClickArg) {
    const [, horaStr] = arg.dateStr.split("T")
    const hora = horaStr ? horaStr.slice(0, 5) : "09:00"
    // Redondear a slot de 30 min
    const [hh, mm] = hora.split(":").map(Number)
    const mmRound  = mm < 30 ? "00" : "30"
    setFormFecha(arg.date)
    setFormHora(`${String(hh).padStart(2, "0")}:${mmRound}`)
    setFormOpen(true)
  }

  function handleEventClick(arg: EventClickArg) {
    setSelectedCita(arg.event.extendedProps as CitaEvento)
    setDetailOpen(true)
  }

  async function handleEventDrop(arg: EventDropArg) {
    const cita      = arg.event.extendedProps as CitaEvento
    const nuevaFecha = arg.event.startStr.split("T")[0]
    const nuevaHora  = arg.event.startStr.split("T")[1]?.slice(0, 5) ?? "09:00"

    try {
      const res = await fetch(`/api/citas/${cita.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ fecha: nuevaFecha, hora: nuevaHora }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error ?? "Error al reagendar")
        arg.revert()
      }
    } catch {
      arg.revert()
    }
  }

  async function handleCambiarEstado(estado: EstadoCita) {
    if (!selectedCita) return
    const res = await fetch(`/api/citas/${selectedCita.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ estado }),
    })
    if (res.ok) {
      toast.success(`Estado actualizado a "${estado}"`)
      setDetailOpen(false)
      fetchCitas()
    } else {
      const d = await res.json().catch(() => ({}))
      toast.error(d.error ?? "Error al cambiar estado")
    }
  }

  async function handleEliminar() {
    if (!selectedCita) return
    const res = await fetch(`/api/citas/${selectedCita.id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Cita eliminada")
      setDetailOpen(false)
      fetchCitas()
    } else {
      const d = await res.json().catch(() => ({}))
      toast.error(d.error ?? "Error al eliminar")
    }
  }

  const transicionesValidas = selectedCita
    ? (TRANSICIONES_ESTADO[selectedCita.estado as EstadoCita] ?? [])
    : []

  return (
    <div className="space-y-3">
      {/* Header indicador */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Wifi className={`h-4 w-4 ${realtimeActive ? "text-green-500" : "text-zinc-400"}`} />
          <span>{realtimeActive ? "En vivo" : "Sin conexión realtime"}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => fetchCitas()} disabled={fetching}>
          <RefreshCw className={`h-4 w-4 mr-1 ${fetching ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Calendario */}
      <div className="rounded-lg border bg-card overflow-hidden fc-responsive">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={isMobile ? "timeGridDay" : "timeGridWeek"}
          locale="es"
          headerToolbar={
            isMobile
              ? ({
                  left:   "prev,next",
                  center: "title",
                  right:  "timeGridDay,timeGridWeek",
                } satisfies ToolbarInput)
              : ({
                  left:   "prev,next today",
                  center: "title",
                  right:  "dayGridMonth,timeGridWeek,timeGridDay",
                } satisfies ToolbarInput)
          }
          buttonText={
            isMobile
              ? { today: "Hoy", day: "Día", week: "Sem" }
              : { today: "Hoy", month: "Mes", week: "Semana", day: "Día" }
          }
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          slotDuration="00:30:00"
          allDaySlot={false}
          events={eventos}
          editable
          selectable
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          datesSet={(arg) => {
            currentRangeRef.current = {
              start: arg.startStr.split("T")[0],
              end:   arg.endStr.split("T")[0],
            }
            fetchCitas(arg.startStr.split("T")[0], arg.endStr.split("T")[0])
          }}
          contentHeight={isMobile ? 600 : "auto"}
          eventDisplay="block"
          eventMinHeight={isMobile ? 28 : 20}
          dayMaxEventRows={isMobile ? 2 : 4}
          stickyHeaderDates
        />
      </div>

      {/* Sheet: detalle de cita */}
      <Sheet open={detailOpen} onOpenChange={(v) => !v && setDetailOpen(false)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Detalle de cita</SheetTitle>
          </SheetHeader>

          {selectedCita && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente</span>
                  <span className="font-medium">
                    {[selectedCita.cliente.nombre, selectedCita.cliente.apellido].filter(Boolean).join(" ")}
                  </span>
                </div>
                {selectedCita.cliente.telefono && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Teléfono</span>
                    <a href={`tel:${selectedCita.cliente.telefono}`} className="text-primary hover:underline">
                      {selectedCita.cliente.telefono}
                    </a>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Servicio</span>
                  <span>{selectedCita.servicio.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Precio</span>
                  <span>{formatMXN(Number(selectedCita.servicio.precio))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  <CitaEstadoBadge estado={selectedCita.estado} />
                </div>
                {selectedCita.notas && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Notas</span>
                    <span className="text-right max-w-[60%]">{selectedCita.notas}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Cambios de estado */}
              {transicionesValidas.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Cambiar estado</p>
                  <div className="flex flex-wrap gap-2">
                    {transicionesValidas.map((e) => (
                      <Button
                        key={e}
                        variant="outline"
                        size="sm"
                        onClick={() => handleCambiarEstado(e)}
                      >
                        {e === "realizada"  ? "Marcar realizada"  :
                         e === "confirmada" ? "Confirmar"         :
                         e === "cancelada"  ? "Cancelar cita"     :
                         e === "no_asistio" ? "No asistió"        : e}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Convertir a venta */}
              {selectedCita.estado === "realizada" && !selectedCita.ventaId && (
                <Button
                  className="w-full"
                  onClick={() => {
                    setDetailOpen(false)
                    setConvertirOpen(true)
                  }}
                >
                  Convertir a venta
                </Button>
              )}

              {selectedCita.ventaId && (
                <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200 w-full justify-center">
                  Ya convertida en venta
                </Badge>
              )}

              {/* Eliminar */}
              {["pendiente", "cancelada"].includes(selectedCita.estado) && (
                <>
                  <Separator />
                  <Button variant="destructive" size="sm" className="w-full" onClick={handleEliminar}>
                    Eliminar cita
                  </Button>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Modal: convertir a venta */}
      <ConvertirCitaModal
        cita={selectedCita ? {
          id:       selectedCita.id,
          fecha:    String(selectedCita.fecha).split("T")[0],
          estado:   selectedCita.estado,
          ventaId:  selectedCita.ventaId,
          cliente:  selectedCita.cliente,
          servicio: { nombre: selectedCita.servicio.nombre, precio: selectedCita.servicio.precio },
        } : null}
        open={convertirOpen}
        onClose={() => setConvertirOpen(false)}
        onSuccess={() => fetchCitas()}
      />

      {/* Form: nueva cita desde click en slot */}
      <CitaForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => fetchCitas()}
        defaultFecha={formFecha}
        defaultHora={formHora}
      />
    </div>
  )
}
