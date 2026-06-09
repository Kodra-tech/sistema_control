import { z } from "zod"
import { CATEGORIAS_GASTO } from "@/lib/constants"

export const gastoSchema = z.object({
  concepto:    z.string().min(2, "Mínimo 2 caracteres").max(200),
  monto:       z.number().positive("El monto debe ser mayor a 0"),
  categoria:   z.enum(CATEGORIAS_GASTO),
  fecha:       z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha inválida"),
  comprobante: z.string().url("URL inválida").optional().nullable().or(z.literal("")),
  notas:       z.string().max(500).optional().nullable(),
})

export const gastoUpdateSchema = gastoSchema.partial()

export type GastoInput       = z.infer<typeof gastoSchema>
export type GastoUpdateInput = z.infer<typeof gastoUpdateSchema>
