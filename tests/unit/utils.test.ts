import { describe, it, expect } from "vitest"
import { formatMXN, formatCurrency, parseCurrency } from "@/lib/utils/currency"

// ─── Helpers reutilizados en el proyecto ─────────────────────────────────────

function detectarConflictoHorario(horaMs: number, citasMs: number[]): boolean {
  const VENTANA_MS = 30 * 60 * 1000
  return citasMs.some((c) => Math.abs(c - horaMs) < VENTANA_MS)
}

function calcularMargen(precio: number, costo: number): number {
  if (precio === 0) return 0
  return ((precio - costo) / precio) * 100
}

// ─── formatMXN ────────────────────────────────────────────────────────────────

describe("formatMXN", () => {
  it('formatea 1234.5 como "$1,234.50"', () => {
    expect(formatMXN(1234.5)).toBe("$1,234.50")
  })

  it('formatea 0 como "$0.00"', () => {
    expect(formatMXN(0)).toBe("$0.00")
  })

  it("formatea número negativo", () => {
    expect(formatMXN(-100)).toBe("-$100.00")
  })

  it("redondea a 2 decimales", () => {
    expect(formatMXN(1.999)).toBe("$2.00")
  })
})

// ─── formatCurrency ───────────────────────────────────────────────────────────

describe("formatCurrency", () => {
  it("acepta null y retorna $0.00", () => {
    expect(formatCurrency(null)).toBe("$0.00")
  })

  it("acepta undefined y retorna $0.00", () => {
    expect(formatCurrency(undefined)).toBe("$0.00")
  })

  it("acepta string numérico", () => {
    expect(formatCurrency("500.5")).toBe("$500.50")
  })

  it("acepta número directamente", () => {
    expect(formatCurrency(100)).toBe("$100.00")
  })
})

// ─── parseCurrency ────────────────────────────────────────────────────────────

describe("parseCurrency", () => {
  it("parsea '$1,234.50' a 1234.5", () => {
    expect(parseCurrency("$1,234.50")).toBe(1234.5)
  })

  it("parsea '$0.00' a 0", () => {
    expect(parseCurrency("$0.00")).toBe(0)
  })
})

// ─── Detección de conflicto de horario ───────────────────────────────────────

describe("detección de conflicto de horario ±30 min", () => {
  const toMs = (h: number, m: number) => h * 3_600_000 + m * 60_000

  it("detecta conflicto a 20 minutos de diferencia", () => {
    expect(detectarConflictoHorario(toMs(10, 20), [toMs(10, 0)])).toBe(true)
  })

  it("detecta conflicto a 29 minutos de diferencia", () => {
    expect(detectarConflictoHorario(toMs(10, 29), [toMs(10, 0)])).toBe(true)
  })

  it("no detecta conflicto a exactamente 30 minutos (no estricto)", () => {
    expect(detectarConflictoHorario(toMs(10, 30), [toMs(10, 0)])).toBe(false)
  })

  it("no detecta conflicto a 60 minutos de diferencia", () => {
    expect(detectarConflictoHorario(toMs(11, 0), [toMs(10, 0)])).toBe(false)
  })

  it("detecta conflicto con varias citas: al menos una en ventana", () => {
    expect(detectarConflictoHorario(toMs(14, 0), [toMs(10, 0), toMs(14, 15)])).toBe(true)
  })

  it("retorna false si no hay citas existentes", () => {
    expect(detectarConflictoHorario(toMs(9, 0), [])).toBe(false)
  })
})

// ─── Cálculo de margen bruto ─────────────────────────────────────────────────

describe("calcularMargen", () => {
  it("calcula margen del 50% correctamente", () => {
    expect(calcularMargen(200, 100)).toBe(50)
  })

  it("retorna 0 cuando precio es 0 (evita división entre cero)", () => {
    expect(calcularMargen(0, 0)).toBe(0)
  })

  it("retorna 0 cuando costo === precio", () => {
    expect(calcularMargen(100, 100)).toBe(0)
  })

  it("calcula margen del 100% cuando costo es 0", () => {
    expect(calcularMargen(500, 0)).toBe(100)
  })

  it("calcula margen decimal correctamente", () => {
    const margen = calcularMargen(300, 200)
    expect(margen).toBeCloseTo(33.33, 1)
  })
})
