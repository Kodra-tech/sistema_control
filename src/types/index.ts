// ─── Respuestas de API ────────────────────────────────────────────────────────

export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string }

export type ApiListResponse<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
  error: null
} | {
  data: null
  total: null
  page: null
  pageSize: null
  error: string
}

// ─── Paginación ───────────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface SortParams {
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface SearchParams extends PaginationParams, SortParams {
  q?: string
}

// ─── Fechas y rangos ──────────────────────────────────────────────────────────

export interface DateRange {
  desde: string // ISO date: "YYYY-MM-DD"
  hasta: string // ISO date: "YYYY-MM-DD"
}

// ─── Estados de cita ─────────────────────────────────────────────────────────

export type EstadoCita =
  | "pendiente"
  | "confirmada"
  | "completada"
  | "cancelada"
  | "no_asistio"

// ─── Métodos de pago ─────────────────────────────────────────────────────────

export type MetodoPago = "efectivo" | "tarjeta" | "transferencia" | "otro"

// ─── Roles de usuario ────────────────────────────────────────────────────────

export type RolUsuario = "dueno" | "empleado"

// ─── Categorías ──────────────────────────────────────────────────────────────

export type CategoriaServicio =
  | "corte"
  | "tinte"
  | "peinado"
  | "manicure"
  | "pedicure"
  | "tratamiento"
  | "otro"

export type CategoriaGasto =
  | "renta"
  | "salario"
  | "insumos"
  | "servicios"
  | "publicidad"
  | "mantenimiento"
  | "otro"

export type CategoriaInventario =
  | "tinte"
  | "shampoo"
  | "acondicionador"
  | "tratamiento"
  | "herramienta"
  | "accesorio"
  | "otro"

export type UnidadInventario =
  | "pieza"
  | "litro"
  | "mililitro"
  | "gramo"
  | "kilogramo"

// ─── KPIs del dashboard ───────────────────────────────────────────────────────

export interface KpiMensual {
  anio: number
  mes: number
  totalVentas: number
  numVentas: number
  totalGastos: number
  numGastos: number
  utilidadNeta: number
}
