import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { CotizacionPDF } from "@/components/documentos/CotizacionPDF"
import { NotaVentaPDF } from "@/components/documentos/NotaVentaPDF"

const bodySchema = z.object({
  tipo:       z.enum(["cotizacion", "nota_venta"]),
  cliente_id: z.string().uuid().optional().nullable(),
  servicios:  z.array(z.object({
    nombre:   z.string(),
    cantidad: z.number().int().positive(),
    precio:   z.number().positive(),
  })).min(1),
  metodo_pago: z.enum(["efectivo", "tarjeta", "transferencia", "otro"]).optional(),
  descuento:   z.number().min(0).optional(),
})

// ── POST /api/documentos/pdf ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body   = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const { tipo, cliente_id, servicios, metodo_pago = "efectivo", descuento = 0 } = parsed.data

  const config = await prisma.configuracion.findFirst({
    select: { nombreSalon: true, telefono: true, email: true, direccion: true },
  })

  const salon = {
    nombre:    config?.nombreSalon ?? "Salón de Belleza",
    telefono:  config?.telefono    ?? null,
    email:     config?.email       ?? null,
    direccion: config?.direccion   ?? null,
  }

  let cliente: { nombre: string; telefono?: string | null; email?: string | null } | null = null
  if (cliente_id) {
    const c = await prisma.cliente.findUnique({
      where:  { id: cliente_id },
      select: { nombre: true, apellido: true, telefono: true, email: true },
    })
    if (c) {
      cliente = {
        nombre:   [c.nombre, c.apellido].filter(Boolean).join(" "),
        telefono: c.telefono,
        email:    c.email,
      }
    }
  }

  const fechaStr = new Date().toLocaleDateString("es-MX")
  let buffer: Uint8Array
  let filename:  string

  if (tipo === "cotizacion") {
    const numero = `COT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`
    buffer       = await renderToBuffer(
      <CotizacionPDF data={{ salon, cliente, servicios, numero, fecha: fechaStr }} />,
    )
    filename = `cotizacion-${numero}.pdf`
  } else {
    const count  = await prisma.venta.count()
    const folio  = `NV-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`
    buffer       = await renderToBuffer(
      <NotaVentaPDF data={{ folio, salon, cliente, servicios, metodoPago: metodo_pago, descuento, fecha: fechaStr }} />,
    )
    filename = `nota-venta-${folio}.pdf`
  }

  return new NextResponse(Buffer.from(buffer), {
    status:  200,
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length":      String(buffer.length),
    },
  })
}
