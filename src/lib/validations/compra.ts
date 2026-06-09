import { z } from "zod"

export const compraSchema = z.object({
  productoId:     z.string().uuid("ID de producto inválido"),
  cantidad:       z.number().positive("La cantidad debe ser mayor a 0"),
  precioUnitario: z.number().positive("El precio debe ser mayor a 0"),
  proveedor:      z.string().max(100).optional().nullable(),
  fecha:          z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha inválida"),
  notas:          z.string().max(500).optional().nullable(),
})

export type CompraInput = z.infer<typeof compraSchema>
