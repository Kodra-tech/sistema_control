import { redis } from "@/lib/redis"

export const CACHE_TTL = {
  servicios: 60 * 5,   // 5 min
  kpis:      60 * 5,   // 5 min
  citasHoy:  60 * 1,   // 1 min
  reportes:  60 * 10,  // 10 min
} as const

export const CACHE_KEYS = {
  servicios:  ()                                        => "servicios:all",
  servicio:   (id: string)                              => `servicios:${id}`,
  kpis:       (mes: number, anio: number)               => `kpis:${anio}-${mes}`,
  citasHoy:   ()                                        => "citas:hoy",
  reporte:    (tipo: string, desde: string, hasta: string) =>
                `reporte:${tipo}:${desde}:${hasta}`,
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
