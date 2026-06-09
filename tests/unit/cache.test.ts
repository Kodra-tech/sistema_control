import { describe, it, expect, vi, beforeEach } from "vitest"
import { withCache, invalidateCache } from "@/lib/cache"

// ─── Mock de Redis con almacén en memoria ────────────────────────────────────

const mockStore = vi.hoisted(() => new Map<string, unknown>())

vi.mock("@/lib/redis", () => ({
  redis: {
    get: vi.fn((key: string) => Promise.resolve(mockStore.get(key) ?? null)),
    set: vi.fn((key: string, val: unknown) => {
      mockStore.set(key, val)
      return Promise.resolve("OK")
    }),
    del: vi.fn((...keys: string[]) => {
      keys.forEach((k) => mockStore.delete(k))
      return Promise.resolve(keys.length)
    }),
  },
}))

beforeEach(() => {
  mockStore.clear()
})

// ─── withCache ────────────────────────────────────────────────────────────────

describe("withCache", () => {
  it("llama al fetcher en el primer acceso y almacena el resultado", async () => {
    const fetcher = vi.fn(async () => ({ total: 42 }))
    const result  = await withCache("test:key:1", 60, fetcher)

    expect(result).toEqual({ total: 42 })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it("retorna el valor cacheado en la segunda llamada sin invocar al fetcher", async () => {
    const fetcher = vi.fn(async () => "dato fresco")

    await withCache("test:key:2", 60, fetcher)
    const cached = await withCache("test:key:2", 60, fetcher)

    expect(cached).toBe("dato fresco")
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it("almacena arrays correctamente", async () => {
    const datos = [{ id: "1", nombre: "Corte" }, { id: "2", nombre: "Tinte" }]
    const fetcher = vi.fn(async () => datos)

    const r1 = await withCache("test:array", 60, fetcher)
    const r2 = await withCache("test:array", 60, fetcher)

    expect(r1).toEqual(datos)
    expect(r2).toEqual(datos)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it("usa claves distintas de forma independiente", async () => {
    const fetcherA = vi.fn(async () => "A")
    const fetcherB = vi.fn(async () => "B")

    const a = await withCache("test:key:a", 60, fetcherA)
    const b = await withCache("test:key:b", 60, fetcherB)

    expect(a).toBe("A")
    expect(b).toBe("B")
    expect(fetcherA).toHaveBeenCalledTimes(1)
    expect(fetcherB).toHaveBeenCalledTimes(1)
  })
})

// ─── invalidateCache ─────────────────────────────────────────────────────────

describe("invalidateCache", () => {
  it("hace que la siguiente llamada re-fetchee tras invalidar", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce("primera")
      .mockResolvedValueOnce("segunda")

    await withCache("test:inv:1", 60, fetcher)
    await invalidateCache("test:inv:1")
    const result = await withCache("test:inv:1", 60, fetcher)

    expect(result).toBe("segunda")
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it("invalida múltiples claves en una sola llamada", async () => {
    const fa = vi.fn(async () => "A")
    const fb = vi.fn(async () => "B")

    await withCache("test:multi:a", 60, fa)
    await withCache("test:multi:b", 60, fb)
    await invalidateCache("test:multi:a", "test:multi:b")

    await withCache("test:multi:a", 60, fa)
    await withCache("test:multi:b", 60, fb)

    expect(fa).toHaveBeenCalledTimes(2)
    expect(fb).toHaveBeenCalledTimes(2)
  })

  it("no lanza error cuando se llama sin argumentos", async () => {
    await expect(invalidateCache()).resolves.toBeUndefined()
  })
})
