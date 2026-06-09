import { describe, it, expect } from "vitest"

// ─── Lógica pura extraída de POST /api/citas/[id]/convertir ──────────────────

function canConvertir(cita: {
  estado: string
  ventaId: string | null
}): { ok: boolean; error?: string } {
  if (cita.estado !== "realizada") {
    return {
      ok: false,
      error: `La cita debe estar en estado "realizada" para convertirse en venta (estado actual: "${cita.estado}")`,
    }
  }
  if (cita.ventaId !== null) {
    return { ok: false, error: "Esta cita ya fue convertida en venta" }
  }
  return { ok: true }
}

function calcularTotales(
  precio: number,
  descuento = 0,
): { subtotal: number; total: number } {
  const subtotal = precio
  const total    = Math.max(0, subtotal - descuento)
  return { subtotal, total }
}

function buildVentaData(
  cita: { clienteId: string; id: string; fecha: Date; servicio: { precio: number } },
  descuento: number,
  metodoPago: string,
  notas?: string | null,
) {
  const precio   = Number(cita.servicio.precio)
  const subtotal = precio
  const total    = Math.max(0, subtotal - descuento)
  return {
    clienteId:  cita.clienteId,
    citaId:     cita.id,
    subtotal,
    descuento,
    total,
    metodoPago,
    fecha:      cita.fecha,
    notas:      notas ?? null,
  }
}

// ─── canConvertir ─────────────────────────────────────────────────────────────

describe("canConvertir — validación de estado", () => {
  it("falla si la cita está en estado 'pendiente'", () => {
    const r = canConvertir({ estado: "pendiente", ventaId: null })
    expect(r.ok).toBe(false)
    expect(r.error).toContain("pendiente")
  })

  it("falla si la cita está en estado 'confirmada'", () => {
    const r = canConvertir({ estado: "confirmada", ventaId: null })
    expect(r.ok).toBe(false)
    expect(r.error).toContain("confirmada")
  })

  it("falla si la cita está en estado 'cancelada'", () => {
    const r = canConvertir({ estado: "cancelada", ventaId: null })
    expect(r.ok).toBe(false)
  })

  it("falla si la cita ya fue convertida (ventaId !== null)", () => {
    const r = canConvertir({ estado: "realizada", ventaId: "venta-uuid-existente" })
    expect(r.ok).toBe(false)
    expect(r.error).toContain("ya fue convertida")
  })

  it("permite conversión cuando estado es 'realizada' y ventaId es null", () => {
    const r = canConvertir({ estado: "realizada", ventaId: null })
    expect(r.ok).toBe(true)
    expect(r.error).toBeUndefined()
  })
})

// ─── calcularTotales ──────────────────────────────────────────────────────────

describe("calcularTotales", () => {
  it("total igual al precio cuando no hay descuento", () => {
    const { subtotal, total } = calcularTotales(500)
    expect(subtotal).toBe(500)
    expect(total).toBe(500)
  })

  it("aplica descuento correctamente", () => {
    const { subtotal, total } = calcularTotales(500, 50)
    expect(subtotal).toBe(500)
    expect(total).toBe(450)
  })

  it("total nunca es negativo aunque el descuento supere el precio", () => {
    const { total } = calcularTotales(100, 200)
    expect(total).toBe(0)
  })

  it("descuento de cero mantiene el total igual al precio", () => {
    const { total } = calcularTotales(300, 0)
    expect(total).toBe(300)
  })
})

// ─── buildVentaData ───────────────────────────────────────────────────────────

const citaEjemplo = {
  clienteId: "cliente-uuid-001",
  id:        "cita-uuid-001",
  fecha:     new Date("2026-06-15T00:00:00.000Z"),
  servicio:  { precio: 350 },
}

describe("buildVentaData — construcción de datos de venta", () => {
  it("incluye el clienteId correcto", () => {
    const vd = buildVentaData(citaEjemplo, 0, "efectivo")
    expect(vd.clienteId).toBe("cliente-uuid-001")
  })

  it("vincula el citaId en la venta (relación bidireccional)", () => {
    const vd = buildVentaData(citaEjemplo, 0, "efectivo")
    expect(vd.citaId).toBe("cita-uuid-001")
  })

  it("crea venta con datos correctos sin descuento", () => {
    const vd = buildVentaData(citaEjemplo, 0, "efectivo")
    expect(vd.subtotal).toBe(350)
    expect(vd.total).toBe(350)
    expect(vd.metodoPago).toBe("efectivo")
    expect(vd.fecha).toEqual(citaEjemplo.fecha)
  })

  it("aplica descuento y refleja el total correcto", () => {
    const vd = buildVentaData(citaEjemplo, 50, "transferencia")
    expect(vd.total).toBe(300)
    expect(vd.descuento).toBe(50)
  })

  it("notas null por defecto cuando no se pasan", () => {
    const vd = buildVentaData(citaEjemplo, 0, "efectivo")
    expect(vd.notas).toBeNull()
  })

  it("propaga notas cuando se pasan", () => {
    const vd = buildVentaData(citaEjemplo, 0, "efectivo", "Pago con propina")
    expect(vd.notas).toBe("Pago con propina")
  })
})
