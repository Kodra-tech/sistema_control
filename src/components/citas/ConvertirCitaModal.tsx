"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { formatMXN } from "@/lib/utils/currency"

interface CitaParaConvertir {
  id:        string
  fecha:     string
  estado:    string
  ventaId:   string | null
  cliente:   { nombre: string; apellido?: string | null }
  servicio:  { nombre: string; precio: number | string }
}

interface ConvertirCitaModalProps {
  cita:      CitaParaConvertir | null
  open:      boolean
  onClose:   () => void
  onSuccess: () => void
}

const METODOS_PAGO = [
  { value: "efectivo",      label: "Efectivo" },
  { value: "tarjeta",       label: "Tarjeta" },
  { value: "transferencia", label: "Transferencia" },
  { value: "otro",          label: "Otro" },
] as const

export function ConvertirCitaModal({ cita, open, onClose, onSuccess }: ConvertirCitaModalProps) {
  const [metodoPago, setMetodoPago] = useState<string>("efectivo")
  const [descuento,  setDescuento]  = useState<string>("0")
  const [loading,    setLoading]    = useState(false)

  if (!cita) return null

  const precio   = Number(cita.servicio.precio)
  const desc     = Math.max(0, parseFloat(descuento) || 0)
  const total    = Math.max(0, precio - desc)
  const nombre   = [cita.cliente.nombre, cita.cliente.apellido].filter(Boolean).join(" ")
  const fechaStr = new Date(cita.fecha).toLocaleDateString("es-MX")

  async function handleConvertir() {
    if (!cita) return
    setLoading(true)
    try {
      const res = await fetch(`/api/citas/${cita.id}/convertir`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ metodoPago, descuento: desc }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? "Error al convertir la cita")
        return
      }
      toast.success("Cita convertida en venta")
      onSuccess()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convertir cita en venta</DialogTitle>
          <DialogDescription>
            Revisa el resumen antes de confirmar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-lg border p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cliente</span>
            <span className="font-medium">{nombre}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Servicio</span>
            <span className="font-medium">{cita.servicio.nombre}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fecha</span>
            <span>{fechaStr}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Precio</span>
            <span>{formatMXN(precio)}</span>
          </div>
          <div className="flex justify-between font-semibold border-t pt-2">
            <span>Total a cobrar</span>
            <span className="text-green-700">{formatMXN(total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Método de pago</Label>
            <Select value={metodoPago} onValueChange={setMetodoPago}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METODOS_PAGO.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Descuento (MXN)</Label>
            <Input
              type="number"
              min="0"
              max={precio}
              step="0.01"
              value={descuento}
              onChange={(e) => setDescuento(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConvertir} disabled={loading}>
            {loading ? "Procesando…" : "Convertir a venta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
