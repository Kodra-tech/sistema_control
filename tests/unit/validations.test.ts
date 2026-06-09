import { describe, it, expect } from "vitest"
import { clienteSchema } from "@/lib/validations/clientes"
import { citaSchema } from "@/lib/validations/cita"
import { ventaSchema } from "@/lib/validations/venta"

// UUIDs RFC 4122 válidos: versión 4 (3er grupo: 4xxx) + variante 1 (4to grupo: 8/9/a/b)
const UUID_A = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
const UUID_B = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12"

// Formato de fecha usando componentes locales para evitar diferencias UTC/local
function localDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

const manana = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return localDateStr(d)
})()

const ayer = (() => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return localDateStr(d)
})()

// ─── clienteSchema ────────────────────────────────────────────────────────────

describe("clienteSchema", () => {
  it("requiere nombre con mínimo 2 caracteres", () => {
    const r = clienteSchema.safeParse({ nombre: "A" })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.flatten().fieldErrors["nombre"]).toBeDefined()
    }
  })

  it("acepta nombre válido", () => {
    const r = clienteSchema.safeParse({ nombre: "María López" })
    expect(r.success).toBe(true)
  })

  it("rechaza teléfono con menos de 10 dígitos", () => {
    const r = clienteSchema.safeParse({ nombre: "Ana", telefono: "123456789" })
    expect(r.success).toBe(false)
  })

  it("rechaza teléfono con más de 10 dígitos", () => {
    const r = clienteSchema.safeParse({ nombre: "Ana", telefono: "12345678901" })
    expect(r.success).toBe(false)
  })

  it("acepta teléfono de exactamente 10 dígitos", () => {
    const r = clienteSchema.safeParse({ nombre: "Ana", telefono: "1234567890" })
    expect(r.success).toBe(true)
  })

  it("acepta teléfono null (campo opcional)", () => {
    const r = clienteSchema.safeParse({ nombre: "Ana", telefono: null })
    expect(r.success).toBe(true)
  })

  it("rechaza email con formato inválido", () => {
    const r = clienteSchema.safeParse({ nombre: "Ana", email: "no-es-un-email" })
    expect(r.success).toBe(false)
  })

  it("acepta email válido", () => {
    const r = clienteSchema.safeParse({ nombre: "Ana", email: "ana@ejemplo.com" })
    expect(r.success).toBe(true)
  })

  it("acepta email vacío o null", () => {
    const nullR  = clienteSchema.safeParse({ nombre: "Ana", email: null })
    const emptyR = clienteSchema.safeParse({ nombre: "Ana", email: "" })
    expect(nullR.success).toBe(true)
    expect(emptyR.success).toBe(true)
  })
})

// ─── citaSchema ───────────────────────────────────────────────────────────────

describe("citaSchema", () => {
  const base = { clienteId: UUID_A, servicioId: UUID_B, fecha: manana, hora: "10:00" }

  it("no acepta fecha pasada", () => {
    const r = citaSchema.safeParse({ ...base, fecha: ayer })
    expect(r.success).toBe(false)
  })

  it("acepta fecha futura", () => {
    const r = citaSchema.safeParse(base)
    expect(r.success).toBe(true)
  })

  it("rechaza hora con formato inválido (sin cero)", () => {
    const r = citaSchema.safeParse({ ...base, hora: "9:00" })
    expect(r.success).toBe(false)
  })

  it("rechaza hora con solo minutos", () => {
    const r = citaSchema.safeParse({ ...base, hora: ":30" })
    expect(r.success).toBe(false)
  })

  it("acepta hora en formato HH:mm", () => {
    const r = citaSchema.safeParse({ ...base, hora: "09:30" })
    expect(r.success).toBe(true)
  })

  it("acepta hora límite 23:59", () => {
    const r = citaSchema.safeParse({ ...base, hora: "23:59" })
    expect(r.success).toBe(true)
  })

  it("requiere clienteId como UUID válido", () => {
    const r = citaSchema.safeParse({ ...base, clienteId: "no-es-uuid" })
    expect(r.success).toBe(false)
  })
})

// ─── ventaSchema ─────────────────────────────────────────────────────────────

describe("ventaSchema", () => {
  const base = {
    tipo:           "servicio" as const,
    concepto:       "Corte de cabello",
    cantidad:       1,
    precioUnitario: 250,
    metodoPago:     "efectivo" as const,
    fecha:          new Date().toISOString(),
  }

  it("rechaza precioUnitario = 0", () => {
    const r = ventaSchema.safeParse({ ...base, precioUnitario: 0 })
    expect(r.success).toBe(false)
  })

  it("rechaza precioUnitario negativo", () => {
    const r = ventaSchema.safeParse({ ...base, precioUnitario: -10 })
    expect(r.success).toBe(false)
  })

  it("acepta precio positivo", () => {
    const r = ventaSchema.safeParse(base)
    expect(r.success).toBe(true)
  })

  it("rechaza tipo fuera del enum", () => {
    const r = ventaSchema.safeParse({ ...base, tipo: "otro" })
    expect(r.success).toBe(false)
  })

  it("acepta tipo 'producto'", () => {
    const r = ventaSchema.safeParse({ ...base, tipo: "producto" })
    expect(r.success).toBe(true)
  })

  it("rechaza cantidad = 0", () => {
    const r = ventaSchema.safeParse({ ...base, cantidad: 0 })
    expect(r.success).toBe(false)
  })

  it("rechaza fecha inválida", () => {
    const r = ventaSchema.safeParse({ ...base, fecha: "no-es-fecha" })
    expect(r.success).toBe(false)
  })
})
