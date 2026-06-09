import { redis } from "@/lib/redis"

export const CACHE_TTL = {
  servicios:     60 * 5,   // 5 min
  kpis:          60 * 5,   // 5 min
  citasHoy:      60 * 1,   // 1 min
  citasDia:      60 * 1,   // 1 min
  reportes:      60 * 10,  // 10 min
  configuracion: 60 * 5,   // 5 min
  clientes:      60 * 2,   // 2 min
  ventas:        60 * 2,   // 2 min
  gastos:        60 * 2,   // 2 min
  inventario:    60 * 3,   // 3 min
} as const

export const CACHE_KEYS = {
  servicios:     ()                                            => "servicios:all",
  servicio:      (id: string)                                 => `servicios:${id}`,
  kpis:          (mes: number, anio: number)                  => `kpis:${anio}-${mes}`,
  citasHoy:      ()                                           => "citas:hoy",
  citasDia:      (fecha: string)                              => `citas:dia:${fecha}`,
  reporte:       (tipo: string, desde: string, hasta: string) =>
                   `reporte:${tipo}:${desde}:${hasta}`,
  configuracion: ()                                           => "configuracion:singleton",
  clientes:      (activo: boolean)                            => `clientes:list:${activo ? "activos" : "inactivos"}`,
  cliente:       (id: string)                                 => `clientes:${id}`,
  ventas:        (mes: number, anio: number)                  => `ventas:${anio}-${String(mes).padStart(2,"0")}`,
  gastos:        (mes: number, anio: number)                  => `gastos:${anio}-${String(mes).padStart(2,"0")}`,
  reporteMensual:(mes: number, anio: number)                  => `reporte:mensual:${anio}-${String(mes).padStart(2,"0")}`,
  reporteAnual:  (anio: number)                               => `reporte:anual:${anio}`,
  inventario:    ()                                           => "inventario:list",
  inventarioAlertas: ()                                       => "inventario:alertas",
} as const

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await redis.get<T>(key)
  if (cached !== null) return cached
  const data = await fetcher()
  await redis.set(key, data, { ex: ttlSeconds })
  return data
}

export async function invalidateCache(...keys: string[]): Promise<void> {
  if (keys.length === 0) return
  await redis.del(...keys)
}
