import { z } from "zod"

export const ESTADOS_CITA = [
  "pendiente",
  "confirmada",
  "realizada",
  "cancelada",
  "no_asistio",
] as const

export type EstadoCita = (typeof ESTADOS_CITA)[number]

// Transiciones de estado permitidas
export const TRANSICIONES_ESTADO: Record<EstadoCita, EstadoCita[]> = {
  pendiente:   ["confirmada", "cancelada", "no_asistio"],
  confirmada:  ["realizada", "cancelada", "no_asistio"],
  realizada:   [],
  cancelada:   [],
  no_asistio:  [],
}

export const citaSchema = z.object({
  clienteId:  z.string().uuid("ID de cliente inválido"),
  servicioId: z.string().uuid("ID de servicio inválido"),
  fecha: z.string().refine((d) => {
    const date = new Date(d)
    const hoy  = new Date()
    hoy.setHours(0, 0, 0, 0)
    return date >= hoy
  }, "No puede ser fecha pasada"),
  hora:  z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM requerido"),
  notas: z.string().max(500).optional().nullable(),
})

export const citaUpdateSchema = z.object({
  estado: z.enum(ESTADOS_CITA).optional(),
  notas:  z.string().max(500).optional().nullable(),
})

export const convertirCitaSchema = z.object({
  metodoPago: z.enum(["efectivo", "tarjeta", "transferencia", "otro"]).optional(),
  descuento:  z.number().min(0).optional(),
  notas:      z.string().max(500).optional().nullable(),
})

export type CitaInput          = z.infer<typeof citaSchema>
export type CitaUpdateInput    = z.infer<typeof citaUpdateSchema>
export type ConvertirCitaInput = z.infer<typeof convertirCitaSchema>
