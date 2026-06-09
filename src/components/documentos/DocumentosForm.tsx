"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Plus, Trash2, Download, FileText, Clock } from "lucide-react"
import { formatMXN } from "@/lib/utils/currency"
import { METODOS_PAGO } from "@/lib/constants"

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface ServicioItem { nombre: string; cantidad: number; precio: number }
interface ClienteOpt   { id: string; nombre: string; apellido: string | null; telefono: string | null }
interface HistorialItem { tipo: string; filename: string; fecha: string; total: number }

// ── Componente ─────────────────────────────────────────────────────────────────

export function DocumentosForm() {
  const [tipo,       setTipo]       = useState<"cotizacion" | "nota_venta">("cotizacion")
  const [clienteId,  setClienteId]  = useState<string>("")
  const [clientes,   setClientes]   = useState<ClienteOpt[]>([])
  const [busqueda,   setBusqueda]   = useState("")
  const [metodo,     setMetodo]     = useState<string>("efectivo")
  const [descuento,  setDescuento]  = useState<number>(0)
  const [items,      setItems]      = useState<ServicioItem[]>([{ nombre: "", cantidad: 1, precio: 0 }])
  const [generating, setGenerating] = useState(false)
  const [historial,  setHistorial]  = useState<HistorialItem[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Cargar historial de localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("documentos_historial")
      if (saved) setHistorial(JSON.parse(saved) as HistorialItem[])
    } catch { /* ignore */ }
  }, [])

  // Búsqueda de clientes
  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (busqueda.length < 2) { setClientes([]); return }
    debounceRef.current = setTimeout(() => {
      fetch(`/api/clientes?q=${encodeURIComponent(busqueda)}&pageSize=10`)
        .then((r) => r.json())
        .then((d) => setClientes(d.data?.items ?? []))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [busqueda])

  function addItem() {
    setItems((prev) => [...prev, { nombre: "", cantidad: 1, precio: 0 }])
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateItem(i: number, field: keyof ServicioItem, value: string | number) {
    setItems((prev) => prev.map((item, idx) =>
      idx === i ? { ...item, [field]: value } : item,
    ))
  }

  const subtotal  = items.reduce((a, s) => a + s.precio * s.cantidad, 0)
  const total     = Math.max(0, subtotal - descuento)
  const esValido  = items.every((s) => s.nombre.trim().length > 0 && s.precio > 0 && s.cantidad > 0)

  async function handleGenerar() {
    if (!esValido) { toast.error("Completa todos los campos de los ítems"); return }
    setGenerating(true)
    try {
      const res = await fetch("/api/documentos/pdf", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          tipo,
          cliente_id:  clienteId || null,
          servicios:   items,
          metodo_pago: metodo,
          descuento,
        }),
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error ?? "Error al generar el PDF")
        return
      }

      // Disparar descarga
      const blob     = await res.blob()
      const url      = URL.createObjectURL(blob)
      const filename = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "documento.pdf"
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Guardar en historial
      const entry: HistorialItem = {
        tipo:     tipo === "cotizacion" ? "Cotización" : "Nota de venta",
        filename,
        fecha:    new Date().toLocaleDateString("es-MX"),
        total,
      }
      const newHistorial = [entry, ...historial].slice(0, 10)
      setHistorial(newHistorial)
      localStorage.setItem("documentos_historial", JSON.stringify(newHistorial))

      toast.success("PDF generado y descargado")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Tipo de documento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            {(["cotizacion", "nota_venta"] as const).map((t) => (
              <Button
                key={t}
                variant={tipo === t ? "default" : "outline"}
                onClick={() => setTipo(t)}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                {t === "cotizacion" ? "Cotización" : "Nota de venta"}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cliente */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cliente (opcional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input
            placeholder="Buscar por nombre o teléfono…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {clientes.length > 0 && (
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger><SelectValue placeholder="Selecciona un cliente" /></SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {[c.nombre, c.apellido].filter(Boolean).join(" ")}
                    {c.telefono ? ` · ${c.telefono}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {clienteId && (
            <Button variant="ghost" size="sm" onClick={() => { setClienteId(""); setBusqueda("") }}>
              Quitar cliente
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Ítems */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Servicios / Productos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_100px_36px] gap-2 items-end">
              <div>
                {i === 0 && <Label className="text-xs mb-1 block">Descripción</Label>}
                <Input
                  placeholder="Nombre del servicio"
                  value={item.nombre}
                  onChange={(e) => updateItem(i, "nombre", e.target.value)}
                />
              </div>
              <div>
                {i === 0 && <Label className="text-xs mb-1 block">Cant.</Label>}
                <Input
                  type="number"
                  min={1}
                  value={item.cantidad}
                  onChange={(e) => updateItem(i, "cantidad", parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                {i === 0 && <Label className="text-xs mb-1 block">Precio</Label>}
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={item.precio || ""}
                  onChange={(e) => updateItem(i, "precio", parseFloat(e.target.value) || 0)}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                onClick={() => removeItem(i)}
                disabled={items.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addItem} className="w-full">
            <Plus className="h-3.5 w-3.5 mr-1" /> Agregar ítem
          </Button>
        </CardContent>
      </Card>

      {/* Pago + descuento (solo nota venta) */}
      {tipo === "nota_venta" && (
        <Card>
          <CardContent className="pt-4 grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Método de pago</Label>
              <Select value={metodo} onValueChange={setMetodo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METODOS_PAGO.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.icon} {m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Descuento (MXN)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={descuento || ""}
                onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview total */}
      <Card className="bg-muted/40">
        <CardContent className="p-4 flex justify-between items-center">
          <div>
            <p className="text-xs text-muted-foreground">Total a cobrar</p>
            <p className="text-2xl font-bold">{formatMXN(total)}</p>
          </div>
          <Button onClick={handleGenerar} disabled={!esValido || generating} size="lg">
            <Download className="h-4 w-4 mr-2" />
            {generating ? "Generando…" : "Generar PDF"}
          </Button>
        </CardContent>
      </Card>

      {/* Historial */}
      {historial.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Historial reciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {historial.map((h, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                <div>
                  <Badge variant="outline" className="text-xs mr-2">{h.tipo}</Badge>
                  <span className="text-muted-foreground text-xs">{h.fecha}</span>
                </div>
                <span className="font-medium">{formatMXN(h.total)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
