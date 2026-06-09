// Constantes compartidas entre API, validaciones y UI

export const CATEGORIAS_GASTO = [
  "Nómina",
  "Renta",
  "Productos y suministros",
  "Servicios",
  "Marketing",
  "Mantenimiento",
  "Equipo",
  "Otros",
] as const

export type CategoriaGasto = (typeof CATEGORIAS_GASTO)[number]

export const METODOS_PAGO = [
  { value: "efectivo",      label: "Efectivo",       icon: "💵" },
  { value: "transferencia", label: "Transferencia",  icon: "📱" },
  { value: "tarjeta",       label: "Tarjeta",        icon: "💳" },
  { value: "otro",          label: "Otros",          icon: "🔄" },
] as const

export type MetodoPago = "efectivo" | "tarjeta" | "transferencia" | "otro"

export const TIPOS_VENTA = ["servicio", "producto"] as const
export type TipoVenta = (typeof TIPOS_VENTA)[number]

// Colores de gráfica de gastos por categoría
export const CATEGORIAS_INVENTARIO = [
  "Tinte",
  "Shampoo",
  "Acondicionador",
  "Tratamiento",
  "Herramienta",
  "Accesorio",
  "Otro",
] as const

export type CategoriaInventario = (typeof CATEGORIAS_INVENTARIO)[number]

export const UNIDADES_INVENTARIO = [
  "pieza",
  "litro",
  "mililitro",
  "gramo",
  "kilogramo",
] as const

export type UnidadInventario = (typeof UNIDADES_INVENTARIO)[number]

export const GASTO_CATEGORIA_COLORES: Record<string, string> = {
  "Nómina":                  "#6366f1",
  "Renta":                   "#f59e0b",
  "Productos y suministros": "#10b981",
  "Servicios":               "#3b82f6",
  "Marketing":               "#ec4899",
  "Mantenimiento":           "#8b5cf6",
  "Equipo":                  "#14b8a6",
  "Otros":                   "#9ca3af",
}
