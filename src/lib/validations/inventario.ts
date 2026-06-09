import { z } from "zod"
import { CATEGORIAS_INVENTARIO, UNIDADES_INVENTARIO } from "@/lib/constants"

export const inventarioSchema = z.object({
  codigo:         z.string().max(50).optional().nullable(),
  nombre:         z.string().min(2, "Mínimo 2 caracteres").max(100),
  descripcion:    z.string().max(500).optional().nullable(),
  categoria:      z.enum(CATEGORIAS_INVENTARIO),
  unidad:         z.enum(UNIDADES_INVENTARIO),
  stockActual:    z.number().min(0),
  stockMinimo:    z.number().min(0),
  precioUnitario: z.number().positive("El costo debe ser mayor a 0"),
  precioVenta:    z.number().positive().optional().nullable(),
  activo:         z.boolean().optional(),
})

export const inventarioUpdateSchema = inventarioSchema.partial()

export type InventarioInput       = z.infer<typeof inventarioSchema>
export type InventarioUpdateInput = z.infer<typeof inventarioUpdateSchema>
