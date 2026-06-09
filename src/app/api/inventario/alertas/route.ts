import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { withCache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache"

// ── GET /api/inventario/alertas ───────────────────────────────────────────────
// Retorna productos donde stockActual <= stockMinimo, order por (stock - min) ASC

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const fetcher = async () => {
    const items = await prisma.inventario.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, stockActual: true, stockMinimo: true, unidad: true, categoria: true },
      orderBy: { nombre: "asc" },
    })
    // Filtrar y ordenar por diferencia (más urgente primero)
    const alertas = items
      .filter((i) => Number(i.stockActual) <= Number(i.stockMinimo))
      .sort((a, b) => (Number(a.stockActual) - Number(a.stockMinimo)) - (Number(b.stockActual) - Number(b.stockMinimo)))
      .map((i) => ({
        id:          i.id,
        nombre:      i.nombre,
        categoria:   i.categoria,
        stockActual: Number(i.stockActual),
        stockMinimo: Number(i.stockMinimo),
        unidad:      i.unidad,
        deficit:     Number(i.stockMinimo) - Number(i.stockActual),
      }))
    return { items: alertas, total: alertas.length }
  }

  const data = await withCache(CACHE_KEYS.inventarioAlertas(), CACHE_TTL.inventario, fetcher)
  return NextResponse.json({ data })
}
