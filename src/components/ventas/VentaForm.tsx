"use client"

import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { formatMXN } from "@/lib/utils/currency"
import { METODOS_PAGO } from "@/lib/constants"

// ── Schema ────────────────────────────────────────────────────────────────────

const formSchema = z.object({
  tipo:           z.enum(["servicio", "producto"]),
  clienteId:      z.string().optional(),
  servicioId:     z.string().optional(),
  inventarioId:   z.string().optional(),
  concepto:       z.string().min(2, "Mínimo 2 caracteres"),
  cantidad:       z.number().int().positive(),
  precioUnitario: z.number().positive("Precio requerido"),
  costoUnitario:  z.number().min(0).optional(),
  descuento:      z.number().min(0),
  metodoPago:     z.enum(["efectivo", "tarjeta", "transferencia", "otro"]),
  fecha:          z.string(),
  notas:          z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface ServicioOpt {
  id: string; nombre: string; precio: string | number; costo: string | number | null; categoria: string | null
}

interface ProductoOpt {
  id: string; nombre: string; precioUnitario: string | number; stockActual: string | number; unidad: string; categoria: string
}

interface ClienteOpt {
  id: string; nombre: string; apellido: string | null; telefono: string | null
}

// ── NumField helper ───────────────────────────────────────────────────────────

function NumField({ value, onChange, label, min = 0, step = "0.01", disabled = false }:
  { value: number | undefined; onChange: (v: number) => void; label: string; min?: number; step?: string; disabled?: boolean }) {
  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <Input
          type="number"
          step={step}
          min={min}
          disabled={disabled}
          value={value === undefined ? "" : value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
      </FormControl>
    </FormItem>
  )
}

// ── Componente ────────────────────────────────────────────────────────────────

export function VentaForm() {
  const router = useRouter()
  const [servicios,   setServicios]   = useState<ServicioOpt[]>([])
  const [productos,   setProductos]   = useState<ProductoOpt[]>([])
  const [clientes,    setClientes]    = useState<ClienteOpt[]>([])
  const [busqueda,    setBusqueda]    = useState("")
  const [submitting,  setSubmitting]  = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const today = new Date().toISOString().split("T")[0]

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo:           "servicio",
      cantidad:       1,
      descuento:      0,
      precioUnitario: 0,
      metodoPago:     "efectivo",
      fecha:          today,
      concepto:       "",
      notas:          "",
    },
  })

  const tipo           = form.watch("tipo")
  const cantidad       = form.watch("cantidad") ?? 1
  const precioUnitario = form.watch("precioUnitario") ?? 0
  const costoUnitario  = form.watch("costoUnitario") ?? 0
  const descuento      = form.watch("descuento") ?? 0

  const subtotal = precioUnitario * cantidad
  const total    = Math.max(0, subtotal - descuento)
  const utilidad = (precioUnitario - (costoUnitario ?? 0)) * cantidad
  const margen   = subtotal > 0 ? (utilidad / subtotal) * 100 : 0

  // Cargar servicios y productos
  useEffect(() => {
    fetch("/api/servicios?activo=true&pageSize=200")
      .then((r) => r.json())
      .then((d) => setServicios(d.data?.items ?? []))
      .catch(() => {})
    fetch("/api/inventario?activo=true&pageSize=200")
      .then((r) => r.json())
      .then((d) => setProductos(d.data?.items ?? []))
      .catch(() => {})
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

  function handleServicioChange(id: string) {
    const s = servicios.find((x) => x.id === id)
    if (!s) return
    form.setValue("servicioId",     id)
    form.setValue("concepto",       s.nombre)
    form.setValue("precioUnitario", Number(s.precio))
    if (s.costo) form.setValue("costoUnitario", Number(s.costo))
  }

  function handleProductoChange(id: string) {
    const p = productos.find((x) => x.id === id)
    if (!p) return
    form.setValue("inventarioId",   id)
    form.setValue("concepto",       p.nombre)
    form.setValue("precioUnitario", Number(p.precioUnitario))
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const body = {
        clienteId:     values.clienteId     || null,
        citaId:        null,
        inventarioId:  values.inventarioId  || null,
        tipo:          values.tipo,
        concepto:      values.concepto,
        cantidad:      values.cantidad,
        precioUnitario: values.precioUnitario,
        costoUnitario: values.costoUnitario ?? null,
        descuento:     values.descuento,
        metodoPago:    values.metodoPago,
        fecha:         values.fecha,
        notas:         values.notas || null,
      }
      const res = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? "Error al registrar la venta")
        return
      }
      toast.success("Venta registrada")
      router.push("/ventas")
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  // Agrupar servicios por categoría
  const svcsXCat = servicios.reduce<Record<string, ServicioOpt[]>>((acc, s) => {
    const cat = s.categoria ?? "Sin categoría"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">

        {/* Toggle tipo */}
        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de venta</FormLabel>
              <FormControl>
                <ToggleGroup
                  type="single"
                  value={field.value}
                  onValueChange={(v) => { if (v) field.onChange(v) }}
                  className="justify-start"
                >
                  <ToggleGroupItem value="servicio" className="px-6">Servicio</ToggleGroupItem>
                  <ToggleGroupItem value="producto" className="px-6">Producto</ToggleGroupItem>
                </ToggleGroup>
              </FormControl>
            </FormItem>
          )}
        />

        {/* Selección de servicio o producto */}
        {tipo === "servicio" ? (
          <FormItem>
            <FormLabel>Servicio</FormLabel>
            <Select onValueChange={handleServicioChange}>
              <SelectTrigger><SelectValue placeholder="Selecciona un servicio" /></SelectTrigger>
              <SelectContent>
                {Object.entries(svcsXCat).sort().map(([cat, svcs]) => (
                  <SelectGroup key={cat}>
                    <SelectLabel>{cat}</SelectLabel>
                    {svcs.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nombre} — {formatMXN(Number(s.precio))}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        ) : (
          <FormItem>
            <FormLabel>Producto</FormLabel>
            <Select onValueChange={handleProductoChange}>
              <SelectTrigger><SelectValue placeholder="Selecciona un producto" /></SelectTrigger>
              <SelectContent>
                {productos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre} — Stock: {Number(p.stockActual)} {p.unidad}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}

        {/* Concepto */}
        <FormField
          control={form.control}
          name="concepto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Concepto</FormLabel>
              <FormControl>
                <Input placeholder="Descripción de la venta" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cliente */}
        <div className="space-y-1.5">
          <FormLabel>Cliente (opcional)</FormLabel>
          <Input
            placeholder="Buscar por nombre o teléfono…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {clientes.length > 0 && (
            <Select onValueChange={(v) => form.setValue("clienteId", v)}>
              <SelectTrigger><SelectValue placeholder="Selecciona cliente" /></SelectTrigger>
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
        </div>

        {/* Cantidad + Precio + Costo */}
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="cantidad"
            render={({ field }) => (
              <NumField
                label="Cantidad"
                value={field.value}
                onChange={field.onChange}
                min={1}
                step="1"
              />
            )}
          />
          <FormField
            control={form.control}
            name="precioUnitario"
            render={({ field }) => (
              <NumField label="Precio unitario" value={field.value} onChange={field.onChange} />
            )}
          />
          <FormField
            control={form.control}
            name="costoUnitario"
            render={({ field }) => (
              <NumField
                label="Costo unitario"
                value={field.value ?? undefined}
                onChange={(v) => field.onChange(v || undefined)}
              />
            )}
          />
        </div>

        {/* Descuento + Método pago + Fecha */}
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="descuento"
            render={({ field }) => (
              <NumField label="Descuento" value={field.value} onChange={field.onChange} />
            )}
          />
          <FormField
            control={form.control}
            name="metodoPago"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Método de pago</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {METODOS_PAGO.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.icon} {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fecha"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Preview en tiempo real */}
        <Card className="bg-muted/40">
          <CardContent className="p-4 grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Total</p>
              <p className="font-bold text-lg">{formatMXN(total)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Utilidad</p>
              <p className={`font-bold text-lg ${utilidad >= 0 ? "text-green-700" : "text-red-700"}`}>
                {formatMXN(utilidad)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Margen</p>
              <p className={`font-bold text-lg ${margen >= 50 ? "text-green-700" : margen >= 20 ? "text-amber-700" : "text-red-700"}`}>
                {margen.toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notas */}
        <FormField
          control={form.control}
          name="notas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Guardando…" : "Registrar venta"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
