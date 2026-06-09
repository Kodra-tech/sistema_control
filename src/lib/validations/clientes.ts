import { z } from "zod"

export const clienteSchema = z.object({
  nombre:   z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  apellido: z.string().max(100).optional().nullable(),
  telefono: z
    .string()
    .refine(
      (v) => !v || /^\d{10}$/.test(v),
      "El teléfono debe tener exactamente 10 dígitos",
    )
    .optional()
    .nullable(),
  email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
  notas: z.string().max(500).optional().nullable(),
})

export const clienteUpdateSchema = clienteSchema.partial()

export type ClienteInput       = z.infer<typeof clienteSchema>
export type ClienteUpdateInput = z.infer<typeof clienteUpdateSchema>
