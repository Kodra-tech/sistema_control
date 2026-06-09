"use client"

import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { CalendarIcon, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

// ── Tipos locales ─────────────────────────────────────────────────────────────

interface ClienteOption {
  id:       string
  nombre:   string
  apellido: string | null
  telefono: string | null
}

interface ServicioOption {
  id:              string
  nombre:          string
  categoria:       string | null
  duracionMinutos: number
  precio:          string | number
}

// ── Schema del formulario ─────────────────────────────────────────────────────

const formSchema = z.object({
  clienteId:  z.string().min(1, "Selecciona un cliente"),
  servicioId: z.string().min(1, "Selecciona un servicio"),
  fecha:      z.date(),
  hora:       z.string().regex(/^\d{2}:\d{2}$/, "Selecciona una hora"),
  notas:      z.string().max(500).optional(),
})

type FormValues = z.infer<typeof formSchema>

// ── Slots de horario ──────────────────────────────────────────────────────────

const TIME_SLOTS: string[] = []
for (let h = 8; h < 20; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`)
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`)
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface CitaFormProps {
  open:           boolean
  onClose:        () => void
  onSuccess:      () => void
  defaultFecha?:  Date
  defaultHora?:   string
  defaultValues?: {
    id:         string
    clienteId:  string
    servicioId: string
    fecha:      Date
    hora:       string
    notas?:     string | null
  } | null
}

export function CitaForm({ open, onClose, onSuccess, defaultFecha, defaultHora, defaultValues }: CitaFormProps) {
  const [clientes,     setClientes]     = useState<ClienteOption[]>([])
  const [servicios,    setServicios]    = useState<ServicioOption[]>([])
  const [busqueda,     setBusqueda]     = useState("")
  const [loadingCli,   setLoadingCli]   = useState(false)
  const [conflicto,    setConflicto]    = useState<string | null>(null)
  const [submitting,   setSubmitting]   = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const isEditing = !!defaultValues?.id

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clienteId:  defaultValues?.clienteId  ?? "",
      servicioId: defaultValues?.servicioId ?? "",
      fecha:      defaultValues?.fecha ?? defaultFecha ?? undefined,
      hora:       defaultValues?.hora  ?? defaultHora  ?? "",
      notas:      defaultValues?.notas ?? "",
    },
  })

  // Cargar servicios una vez
  useEffect(() => {
    fetch("/api/servicios?activo=true&pageSize=200")
      .then((r) => r.json())
      .then((d) => setServicios(d.data?.items ?? []))
      .catch(() => {})
  }, [])

  // Búsqueda de clientes con debounce
  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (busqueda.length < 2) { setClientes([]); return }
    setLoadingCli(true)
    debounceRef.current = setTimeout(() => {
      fetch(`/api/clientes?q=${encodeURIComponent(busqueda)}&pageSize=10`)
        .then((r) => r.json())
        .then((d) => setClientes(d.data?.items ?? []))
        .catch(() => {})
        .finally(() => setLoadingCli(false))
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [busqueda])

  // Pre-cargar cliente actual en edición
  useEffect(() => {
    if (defaultValues?.clienteId && open) {
      fetch(`/api/clientes/${defaultValues.clienteId}`)
        .then((r) => r.json())
        .then((d) => { if (d.data) setClientes([d.data]) })
        .catch(() => {})
    }
  }, [defaultValues?.clienteId, open])

  // Reset on open/close
  useEffect(() => {
    if (!open) {
      form.reset()
      setConflicto(null)
      setBusqueda("")
    }
  }, [open, form])

  // Agrupar servicios por categoría
  const serviciosPorCat = servicios.reduce<Record<string, ServicioOption[]>>((acc, s) => {
    const cat = s.categoria ?? "Sin categoría"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    setConflicto(null)
    try {
      const fechaISO = format(values.fecha, "yyyy-MM-dd")
      const url      = isEditing ? `/api/citas/${defaultValues!.id}` : "/api/citas"
      const method   = isEditing ? "PATCH" : "POST"

      const body = isEditing
        ? { notas: values.notas ?? null }
        : {
            clienteId:  values.clienteId,
            servicioId: values.servicioId,
            fecha:      fechaISO,
            hora:       values.hora,
            notas:      values.notas ?? null,
          }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 409) {
          setConflicto(data.error ?? "Ya hay una cita cerca de ese horario")
          return
        }
        toast.error(data.error ?? "Error al guardar la cita")
        return
      }

      toast.success(isEditing ? "Cita actualizada" : "Cita creada")
      onSuccess()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{isEditing ? "Editar cita" : "Nueva cita"}</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* Cliente */}
            <div className="space-y-1.5">
              <FormLabel>Cliente</FormLabel>
              <Input
                placeholder="Buscar por nombre o teléfono…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                disabled={isEditing}
              />
              {loadingCli && <p className="text-xs text-muted-foreground">Buscando…</p>}
              {clientes.length > 0 && (
                <FormField
                  control={form.control}
                  name="clienteId"
                  render={({ field }) => (
                    <FormItem>
                      <Select value={field.value} onValueChange={field.onChange} disabled={isEditing}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {[c.nombre, c.apellido].filter(Boolean).join(" ")}
                              {c.telefono ? ` · ${c.telefono}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {form.formState.errors.clienteId && (
                <p className="text-sm text-destructive">{form.formState.errors.clienteId.message}</p>
              )}
            </div>

            {/* Servicio */}
            <FormField
              control={form.control}
              name="servicioId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Servicio</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isEditing}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un servicio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(serviciosPorCat).sort().map(([cat, svcs]) => (
                        <SelectGroup key={cat}>
                          <SelectLabel>{cat}</SelectLabel>
                          {svcs.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.nombre} · {s.duracionMinutos} min
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fecha */}
            <FormField
              control={form.control}
              name="fecha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                          disabled={isEditing}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP", { locale: es }) : "Selecciona fecha"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hora */}
            <FormField
              control={form.control}
              name="hora"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isEditing}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona hora" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIME_SLOTS.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notas */}
            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} maxLength={500} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conflicto de horario */}
            {conflicto && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">{conflicto}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? "Guardando…" : isEditing ? "Actualizar" : "Crear cita"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
