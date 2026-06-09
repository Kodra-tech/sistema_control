import { z } from "zod"

export const ventaSchema = z.object({
  clienteId:     z.string().uuid().optional().nullable(),
  citaId:        z.string().uuid().optional().nullable(),
  inventarioId:  z.string().uuid().optional().nullable(),
  tipo:          z.enum(["servicio", "producto"]),
  concepto:      z.string().min(2, "Mínimo 2 caracteres").max(200),
  cantidad:      z.number().int().positive("La cantidad debe ser mayor a 0"),
  precioUnitario: z.number().positive("El precio debe ser mayor a 0"),
  costoUnitario:  z.number().min(0).optional().nullable(),
  descuento:     z.number().min(0).optional(),
  metodoPago:    z.enum(["efectivo", "tarjeta", "transferencia", "otro"]),
  fecha:         z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha inválida"),
  notas:         z.string().max(500).optional().nullable(),
})

export const ventaUpdateSchema = z.object({
  metodoPago: z.enum(["efectivo", "tarjeta", "transferencia", "otro"]).optional(),
  descuento:  z.number().min(0).optional(),
  notas:      z.string().max(500).optional().nullable(),
})

export type VentaInput       = z.infer<typeof ventaSchema>
export type VentaUpdateInput = z.infer<typeof ventaUpdateSchema>
