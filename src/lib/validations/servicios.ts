import { z } from "zod"

export const CATEGORIAS_SERVICIO = [
  "Corte",
  "Color",
  "Tratamientos",
  "Uñas",
  "Maquillaje",
  "Spa",
  "Depilación",
  "Novias",
] as const

export type CategoriaServicio = (typeof CATEGORIAS_SERVICIO)[number]

export const servicioSchema = z.object({
  nombre:           z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  descripcion:      z.string().max(500).optional().nullable(),
  precio:           z.number().positive("El precio debe ser mayor a 0"),
  costo:            z.number().min(0, "El costo no puede ser negativo").optional().nullable(),
  duracion_minutos: z.number().int().positive("La duración debe ser mayor a 0"),
  categoria:        z.string().optional().nullable(),
  activo:           z.boolean(),
})

export const servicioUpdateSchema = servicioSchema.partial()

export type ServicioInput       = z.infer<typeof servicioSchema>
export type ServicioUpdateInput = z.infer<typeof servicioUpdateSchema>
