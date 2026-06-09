import { z } from "zod"

export const configuracionSchema = z.object({
  nombre_salon: z
    .string()
    .min(2, "El nombre del salón debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar 100 caracteres"),
  moneda: z
    .string()
    .min(1, "La moneda es requerida"),
  anio_fiscal: z
    .number()
    .int("Debe ser un año entero")
    .min(2000, "El año fiscal debe ser un número de 4 dígitos (2000–2099)")
    .max(2099, "El año fiscal debe ser un número de 4 dígitos (2000–2099)"),
  telefono:     z.string().max(20).optional().nullable(),
  email:        z.string().email("Email inválido").optional().nullable().or(z.literal("")),
  direccion:    z.string().max(300).optional().nullable(),
  zona_horaria: z.string().optional(),
})

export type ConfiguracionInput = z.infer<typeof configuracionSchema>
